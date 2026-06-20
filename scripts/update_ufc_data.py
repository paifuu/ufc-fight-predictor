#!/usr/bin/env python3
"""
UFC Data Auto-Updater
=====================
Automates 5 features:
  1. Auto-update fighter records from live UFC/ESPN data
  2. Auto-populate upcoming fights (remove past, add future)
  3. Auto-fetch fighter stats from live sources
  4. (Run via GitHub Actions weekly cron)
  5. Auto-download transparent fighter images (520x325 UFC CDN PNGs)

Usage:
  python scripts/update_ufc_data.py [--records] [--events] [--images] [--all]
"""

import json
import os
import re
import sys
import time
import argparse
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / "src" / "data"
PUBLIC_FIGHTERS = ROOT / "public" / "fighters"

# ------------------------------------------------------------------
# UFC slugs: maps fighter name → UFC.com athlete slug
# Used to find the correct CDN image URL for each fighter
# ------------------------------------------------------------------
UFC_SLUGS = {
    "Ilia Topuria":          "ilia-topuria",
    "Justin Gaethje":        "justin-gaethje",
    "Alex Pereira":          "alex-pereira",
    "Ciryl Gane":            "ciryl-gane",
    "Sean O'Malley":         "sean-omalley",
    "Aiemann Zahabi":        "aiemann-zahabi",
    "Mauricio Ruffy":        "mauricio-ruffy",
    "Michael Chandler":      "michael-chandler",
    "Bo Nickal":             "bo-nickal",
    "Kyle Daukaus":          "kyle-daukaus",
    "Diego Lopes":           "diego-lopes",
    "Steve Garcia":          "steve-garcia",
    "Derrick Lewis":         "derrick-lewis",
    "Josh Hokit":            "josh-hokit",
    "Conor McGregor":        "conor-mcgregor",
    "Max Holloway":          "max-holloway",
    "Paddy Pimblett":        "paddy-pimblett",
    "Benoit Saint Denis":    "benoit-saint-denis",
    "Cory Sandhagen":        "cory-sandhagen",
    "Mario Bautista":        "mario-bautista",
    "Gable Steveson":        "gable-steveson",
    "Elisha Ellison":        "elisha-ellison",
    "Brandon Royval":        "brandon-royval",
    "Lone'er Kavanagh":      "loneer-kavanagh",
    "Song Yadong":           "song-yadong",
    "Deiveson Figueiredo":   "deiveson-figueiredo",
    "Belal Muhammad":        "belal-muhammad",
    "Gabriel Bonfim":        "gabriel-bonfim",
    "Jon Jones":             "jon-jones",
    "Islam Makhachev":       "islam-makhachev",
    "Khabib Nurmagomedov":   "khabib-nurmagomedov",
    "Charles Oliveira":      "charles-oliveira",
    "Dricus Du Plessis":     "dricus-du-plessis",
    "Leon Edwards":          "leon-edwards",
    "Daniel Rodriguez":      "daniel-rodriguez",
    "Manel Kape":            "manel-kape",
    "Kai Kara-France":       "kai-kara-france",
    "Rafael Fiziev":         "rafael-fiziev",
    "Renato Moicano":        "renato-moicano",
    "Magomed Ankalaev":      "magomed-ankalaev",
    "Khalil Rountree Jr.":   "khalil-rountree-jr",
    "Kevin Holland":         "kevin-holland",
    "Kyoji Horiguchi":       "kyoji-horiguchi",
    "Umar Nurmagomedov":     "umar-nurmagomedov",
    "David Martinez":        "david-martinez",
    "Shara Magomedov":       "sharabutdin-magomedov",
    "Manuel Torres":         "manuel-torres",
    "Michel Pereira":        "michel-pereira",
    "Uros Medic":            "uros-medic",
    "Joshua Van":            "joshua-van",
    "Tatsuro Taira":         "tatsuro-taira",
}

# ESPN athlete IDs for fighter record lookups
# (Obtained from ESPN MMA athlete search)
ESPN_IDS = {
    "Ilia Topuria":          "4874435",
    "Justin Gaethje":        "3148799",
    "Alex Pereira":          "4565621",
    "Ciryl Gane":            "4430457",
    "Sean O'Malley":         "4035516",
    "Conor McGregor":        "2978843",
    "Max Holloway":          "3022879",
    "Paddy Pimblett":        "4564441",
    "Cory Sandhagen":        "4037407",
    "Islam Makhachev":       "4036820",
    "Charles Oliveira":      "2526498",
    "Derrick Lewis":         "3022818",
    "Jon Jones":             "2974243",
    "Khabib Nurmagomedov":   "3093781",
    "Magomed Ankalaev":      "4361028",
    "Khalil Rountree Jr.":   "3895991",
    "Umar Nurmagomedov":     "4697494",
    "Rafael Fiziev":         "4244455",
    "Shara Magomedov":       "4875503",
    "Michel Pereira":        "4427459",
    "Manel Kape":            "4297444",
    "Kyoji Horiguchi":       "3918044",
    "Brandon Royval":        "4034994",
    "Renato Moicano":        "3150124",
    "Mauricio Ruffy":        "4874819",
    "Bo Nickal":             "4874802",
    "Diego Lopes":           "4565428",
    "Dricus Du Plessis":     "4874476",
    "Leon Edwards":          "3144928",
    "Belal Muhammad":        "3901887",
    "Gabriel Bonfim":        "4696803",
    "Benoit Saint Denis":    "4874835",
    "Mario Bautista":        "4037286",
    "Gable Steveson":        "4874960",
    "Khalil Rountree Jr.":   "3895991",
    "David Martinez":        "4875021",
    "Manuel Torres":         "4875422",
    "Kai Kara-France":       "4034824",
    "Kevin Holland":         "3151091",
    "Song Yadong":           "4036736",
    "Deiveson Figueiredo":   "3899618",
    "Uros Medic":            "4875234",
    "Daniel Rodriguez":      "3900280",
    "Joshua Van":            "4875190",
    "Tatsuro Taira":         "4875310",
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; UFCPredictor/1.0)",
    "Accept": "application/json",
}


def fetch_json(url, timeout=10):
    """Fetch JSON from URL with simple retry logic."""
    req = urllib.request.Request(url, headers=HEADERS)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode())
        except Exception as e:
            if attempt == 2:
                print(f"  [WARN] Failed to fetch {url}: {e}")
                return None
            time.sleep(2 ** attempt)
    return None


def fetch_bytes(url, timeout=15):
    """Download raw bytes from URL."""
    req = urllib.request.Request(url, headers={**HEADERS, "Accept": "image/png,image/*"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read()
        except Exception as e:
            if attempt == 2:
                print(f"  [WARN] Failed to download {url}: {e}")
                return None
            time.sleep(2 ** attempt)
    return None


# ─── 1 & 3. UPDATE FIGHTER RECORDS FROM ESPN ─────────────────────────────────

def update_fighter_records():
    """Fetch current W-L records and key stats from ESPN MMA API."""
    fighters_path = DATA_DIR / "fighters.json"
    with open(fighters_path) as f:
        db = json.load(f)

    updated = 0
    for name, espn_id in ESPN_IDS.items():
        if name not in db:
            continue
        url = f"https://site.api.espn.com/apis/site/v2/sports/mma/ufc/athletes/{espn_id}"
        data = fetch_json(url)
        if not data:
            continue

        athlete = data.get("athlete", {})

        # Record
        record = athlete.get("record", "")
        if record and re.match(r"\d+-\d+", record):
            old = db[name].get("record", "")
            if old != record:
                print(f"  {name}: {old} → {record}")
                db[name]["record"] = record
                updated += 1

        # Win streak
        win_streak = athlete.get("winStreak")
        if win_streak is not None:
            db[name]["stats"]["winStreak"] = int(win_streak)

    with open(fighters_path, "w") as f:
        json.dump(db, f, indent=2, ensure_ascii=False)

    print(f"Updated {updated} fighter records.")
    return updated


# ─── 2. AUTO-POPULATE UPCOMING EVENTS FROM ESPN ──────────────────────────────

def update_upcoming_events():
    """Fetch upcoming UFC events from ESPN and update events.json."""
    events_path = DATA_DIR / "events.json"
    with open(events_path) as f:
        events_data = json.load(f)

    today = datetime.now(timezone.utc).date()

    # Move events that have already passed from upcoming to past
    still_upcoming = []
    newly_past = []
    for event in events_data.get("upcoming", []):
        try:
            event_date = datetime.strptime(event["date"], "%B %d, %Y").date()
            if event_date < today:
                # Fight has passed but we don't have results yet
                # Mark it as needing resolution
                newly_past.append(event)
                print(f"  Moved to past (no result yet): {event['event']}")
            else:
                still_upcoming.append(event)
        except ValueError:
            still_upcoming.append(event)

    events_data["upcoming"] = still_upcoming

    # Add newly passed events to past (without results — manual resolution needed)
    for event in newly_past:
        # Check if already in past
        past_names = {e["event"] for e in events_data.get("past", [])}
        if event["event"] not in past_names:
            events_data.setdefault("past", []).append(event)

    # Fetch upcoming events from ESPN scoreboard
    # Use next 90 days
    from datetime import timedelta
    end_date = today + timedelta(days=90)
    url = (
        f"https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard"
        f"?dates={today.strftime('%Y%m%d')}-{end_date.strftime('%Y%m%d')}"
    )
    data = fetch_json(url)
    if data:
        events = data.get("events", [])
        existing_dates = {e["date"] for e in still_upcoming}
        for event in events:
            event_name = event.get("name", "")
            event_date_str = event.get("date", "")
            if not event_date_str:
                continue
            try:
                event_date = datetime.fromisoformat(event_date_str.replace("Z", "+00:00")).date()
                friendly_date = event_date.strftime("%B %d, %Y")
            except ValueError:
                continue

            if friendly_date in existing_dates:
                continue  # Already have this event

            # Parse fights from ESPN event
            competitions = event.get("competitions", [])
            fights = []
            for comp in competitions:
                competitors = comp.get("competitors", [])
                if len(competitors) < 2:
                    continue
                f1_name = competitors[0].get("athlete", {}).get("displayName", "")
                f2_name = competitors[1].get("athlete", {}).get("displayName", "")
                weight_class = comp.get("type", {}).get("text", "")
                is_main = comp.get("order", 99) == 1
                if f1_name and f2_name:
                    fights.append({
                        "f1": f1_name,
                        "f2": f2_name,
                        "weightClass": weight_class,
                        "isMain": is_main,
                        "context": f"Upcoming UFC fight: {f1_name} vs {f2_name}."
                    })

            if fights:
                venue = event.get("venues", [{}])[0]
                venue_str = f"{venue.get('fullName', '')}, {venue.get('address', {}).get('city', '')}"
                new_event = {
                    "event": event_name,
                    "date": friendly_date,
                    "venue": venue_str.strip(", "),
                    "fights": fights,
                }
                still_upcoming.append(new_event)
                existing_dates.add(friendly_date)
                print(f"  Added from ESPN: {event_name} ({friendly_date})")

    # Sort upcoming by date
    def parse_date(e):
        try:
            return datetime.strptime(e["date"], "%B %d, %Y").date()
        except ValueError:
            return today

    events_data["upcoming"] = sorted(still_upcoming, key=parse_date)

    with open(events_path, "w") as f:
        json.dump(events_data, f, indent=2, ensure_ascii=False)

    print(f"Events updated. {len(events_data['upcoming'])} upcoming, {len(events_data.get('past', []))} past.")


# ─── 5. AUTO-RESOLVE PREDICTIONS (update past events with results) ────────────

def resolve_past_events():
    """Fetch results for past events that are missing actualWinner."""
    events_path = DATA_DIR / "events.json"
    with open(events_path) as f:
        events_data = json.load(f)

    fighters_path = DATA_DIR / "fighters.json"
    with open(fighters_path) as f:
        db = json.load(f)

    resolved = 0
    for event in events_data.get("past", []):
        for fight in event.get("fights", []):
            if "actualWinner" in fight:
                continue  # Already resolved

            # Try to find result from ESPN
            f1, f2 = fight["f1"], fight["f2"]
            # Look up ESPN IDs for both fighters
            id1 = ESPN_IDS.get(f1)
            id2 = ESPN_IDS.get(f2)
            if not id1 or not id2:
                continue

            # Fetch fighter's recent fights to find this matchup
            url = f"https://site.api.espn.com/apis/site/v2/sports/mma/ufc/athletes/{id1}/eventlog"
            data = fetch_json(url)
            if not data:
                continue

            for event_log in data.get("events", {}).get("items", []):
                opponent = event_log.get("opponent", {}).get("displayName", "")
                if f2.lower() not in opponent.lower():
                    continue
                result = event_log.get("gameResult", "")
                method = event_log.get("notes", "")
                if result == "W":
                    fight["actualWinner"] = f1
                elif result == "L":
                    fight["actualWinner"] = f2
                if method:
                    fight["method"] = method
                resolved += 1
                print(f"  Resolved: {f1} vs {f2} → {fight.get('actualWinner', '?')}")
                break

    with open(events_path, "w") as f:
        json.dump(events_data, f, indent=2, ensure_ascii=False)

    print(f"Resolved {resolved} fight results.")


# ─── IMAGE DOWNLOAD: UFC CDN Transparent PNGs ────────────────────────────────

def scrape_ufc_image_url(slug):
    """
    Scrape https://www.ufc.com/athlete/{slug} to find the transparent
    fighter image URL (520x325 PNG from CloudFront CDN).
    Returns the image URL or None.
    """
    url = f"https://www.ufc.com/athlete/{slug}"
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"  [WARN] Cannot fetch UFC page for {slug}: {e}")
        return None

    # Only match the transparent shoulder-up bio image (520x325 PNG)
    # These always use the athlete_bio_full_body style on the UFC CDN
    patterns = [
        r'(https://dmxg5wxfqgde4\.cloudfront\.net/styles/athlete_bio_full_body/[^"\'>\s]+\.png)',
        r'(https://dmxg5wxfqgde4\.cloudfront\.net/styles/athlete_bio_full_body/[^"\'>\s]+)',
        # Some pages encode the URL in HTML entities
        r'(https://dmxg5wxfqgde4\.cloudfront\.net[^"\'>\s]*athlete_bio_full_body[^"\'>\s]+\.png)',
    ]
    for pat in patterns:
        m = re.search(pat, html)
        if m:
            url = m.group(1).replace("&amp;", "&")
            return url

    # Do NOT fall back to generic featured image — those are promo shots, not transparent PNGs
    print(f"  [WARN] athlete_bio_full_body image not found for {slug} — page may have changed markup")
    return None


def download_fighter_images(fighters=None, force=False):
    """
    Download transparent fighter PNGs from UFC CDN.
    Only downloads missing images unless force=True.
    """
    PUBLIC_FIGHTERS.mkdir(parents=True, exist_ok=True)

    # Load existing FIGHTER_PHOTOS mapping to know expected filenames
    # We'll use the slug as filename, consistent with what App.jsx can reference
    if fighters is None:
        fighters = list(UFC_SLUGS.keys())

    downloaded = 0
    skipped = 0
    failed = []

    for name in fighters:
        slug = UFC_SLUGS.get(name)
        if not slug:
            print(f"  [SKIP] No slug for {name}")
            continue

        # Determine output filename (use existing convention or slug)
        # Map known existing filenames
        existing_map = {
            "David Martinez": "davidmartinez",
            "Umar Nurmagomedov": "umar",
            "Khalil Rountree Jr.": "rountree",
            "Magomed Ankalaev": "ankalaev",
            "Elisha Ellison": "elisha",
            "Benoit Saint Denis": "benoit",
            "Michel Pereira": "michelpereira",
            "Max Holloway": "maxholloway",
            "Paddy Pimblett": "paddypimblett",
            "Conor McGregor": "conormcgregor",
            "Shara Magomedov": "sharaputdin",
            "Rafael Fiziev": "fiziev",
            "Manuel Torres": "manueltorres",
            "Kyoji Horiguchi": "horiguchi",
            "Manel Kape": "manelkape",
            "Gable Steveson": "gable",
            "Lone'er Kavanagh": "kavanagh",
            "Brandon Royval": "royval",
            "Mario Bautista": "mario",
            "Cory Sandhagen": "corysandhagen",
        }
        filename = existing_map.get(name, slug.replace("-", ""))
        out_path = PUBLIC_FIGHTERS / f"{filename}.png"

        if out_path.exists() and not force:
            skipped += 1
            continue

        print(f"  Fetching image for {name}...")
        img_url = scrape_ufc_image_url(slug)
        if not img_url:
            print(f"  [FAIL] No image URL found for {name} ({slug})")
            failed.append(name)
            continue

        print(f"  Downloading: {img_url}")
        data = fetch_bytes(img_url)
        if data and len(data) > 1000:
            out_path.write_bytes(data)
            print(f"  Saved → {out_path.name} ({len(data)//1024}KB)")
            downloaded += 1
        else:
            print(f"  [FAIL] Empty or tiny response for {name}")
            failed.append(name)

        time.sleep(1.5)  # Be polite to UFC servers

    print(f"\nImages: {downloaded} downloaded, {skipped} already existed, {len(failed)} failed.")
    if failed:
        print(f"Failed fighters: {', '.join(failed)}")


def fetch_ufcstats_roster():
    """
    Scrape ufcstats.com for every UFC fighter's official career stats.
    Goes through a-z fighter list pages, then visits each fighter's detail page.
    """
    fighters_path = DATA_DIR / "fighters.json"
    db = json.loads(fighters_path.read_text()) if fighters_path.exists() else {}

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    }

    def fetch_html(url):
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=20) as r:
            raw = r.read()
            # Handle gzip encoding
            import gzip as _gzip
            try:
                return _gzip.decompress(raw).decode("utf-8", errors="replace")
            except Exception:
                return raw.decode("utf-8", errors="replace")

    # Step 1: collect all fighter detail page URLs from the A-Z list
    fighter_urls = {}  # name -> url
    print("Collecting fighter list from ufcstats.com...", flush=True)
    debug_saved = False
    for char in "abcdefghijklmnopqrstuvwxyz":
        try:
            # Try HTTPS first, fall back to HTTP
            for scheme in ("https", "http"):
                try:
                    html = fetch_html(f"{scheme}://www.ufcstats.com/statistics/fighters?char={char}&page=all")
                    break
                except Exception:
                    html = ""
            if not html:
                print(f"  [WARN] Empty response for char={char}", flush=True)
                continue

            # Save first page HTML to debug file so we can inspect it
            if not debug_saved:
                debug_path = ROOT / "debug_ufcstats.html"
                debug_path.write_text(html[:5000])
                print(f"  [DEBUG] Saved first 5000 chars of char=a HTML to debug_ufcstats.html", flush=True)
                print(f"  [DEBUG] HTML preview: {html[:300].replace(chr(10), ' ')}", flush=True)
                debug_saved = True

            # Pattern: href to fighter-details page, name in link text
            all_links = re.findall(
                r'href="(https?://www\.ufcstats\.com/fighter-details/[^"]+)"[^>]*>\s*([^<\s][^<]*?)\s*</a>',
                html
            )
            # Also try relative URLs
            all_links += [
                (f"http://www.ufcstats.com{url}", name)
                for url, name in re.findall(
                    r'href="(/fighter-details/[^"]+)"[^>]*>\s*([^<\s][^<]*?)\s*</a>',
                    html
                )
            ]
            # Group adjacent pairs with same URL → first + last name
            i = 0
            while i < len(all_links) - 1:
                url1, name1 = all_links[i]
                url2, name2 = all_links[i+1]
                if url1 == url2:
                    full = f"{name1.strip()} {name2.strip()}".strip()
                    if full and len(full) > 2:
                        fighter_urls[full] = url1
                    i += 2
                else:
                    i += 1
            print(f"  char={char}: {len(fighter_urls)} total so far ({len(all_links)} raw links found)", flush=True)
        except Exception as e:
            print(f"  [WARN] Failed on char={char}: {e}", flush=True)
        time.sleep(0.3)

    print(f"Found {len(fighter_urls)} fighters on ufcstats.com")

    # Step 2: for each fighter, scrape their career stats
    added = updated = 0
    for name, url in fighter_urls.items():
        try:
            html = fetch_html(url)

            def get_stat(label):
                # ufcstats format: <i class="...">SLpM:</i>\n    7.63\n
                m = re.search(
                    r'<i[^>]*>\s*' + re.escape(label) + r'\s*</i>\s*([\d.]+)',
                    html, re.IGNORECASE
                )
                if m:
                    try: return float(m.group(1))
                    except: pass
                return None

            slpm   = get_stat("SLpM:")   or 3.5
            stracc = get_stat("Str. Acc.:") or 45.0
            sapm   = get_stat("SApM:")   or 3.0
            strdef = get_stat("Str. Def.:") or 55.0
            tdavg  = get_stat("TD Avg.:")  or 1.0
            tdacc  = get_stat("TD Acc.:")  or 40.0
            tddef  = get_stat("TD Def.:")  or 60.0
            subavg = get_stat("Sub. Avg.:") or 0.3

            # Percentages on ufcstats come as e.g. "52%" — strip % if present
            # Percentages on ufcstats come as e.g. "52%" — strip % sign
            def pct(val, raw_html, label):
                m = re.search(r'<i[^>]*>\s*' + re.escape(label) + r'\s*</i>\s*([\d.]+)\s*%?', raw_html, re.IGNORECASE)
                if m:
                    try: return float(m.group(1))
                    except: pass
                return val

            stracc = pct(stracc, html, "Str. Acc.:")
            strdef = pct(strdef, html, "Str. Def.:")
            tdacc  = pct(tdacc,  html, "TD Acc.:")
            tddef  = pct(tddef,  html, "TD Def.:")

            # Record
            wins_m   = re.search(r'<span[^>]*>(\d+)</span>\s*<span[^>]*>Wins',   html)
            losses_m = re.search(r'<span[^>]*>(\d+)</span>\s*<span[^>]*>Losses', html)
            wins   = int(wins_m.group(1))   if wins_m   else 0
            losses = int(losses_m.group(1)) if losses_m else 0

            # Height / reach / stance / weight
            ht_m     = re.search(r'Height:</i>\s*([^<]+)', html)
            reach_m  = re.search(r'Reach:</i>\s*([^<"]+)"', html)
            stance_m = re.search(r'STANCE:</i>\s*([^<]+)', html, re.IGNORECASE)
            wt_m     = re.search(r'Weight:</i>\s*(\d+)', html)

            reach_in = 70
            if reach_m:
                rm = re.search(r'(\d+)', reach_m.group(1))
                if rm: reach_in = int(rm.group(1))

            nat_wt = 155
            if wt_m: nat_wt = int(wt_m.group(1))

            existing = db.get(name)
            if existing:
                existing["record"] = f"{wins}-{losses}"
                existing["stats"]["slpm"]   = round(slpm, 2)
                existing["stats"]["stracc"] = round(stracc, 1)
                existing["stats"]["sapm"]   = round(sapm, 2)
                existing["stats"]["strdef"] = round(strdef, 1)
                existing["stats"]["tdavg"]  = round(tdavg, 2)
                existing["stats"]["tdacc"]  = round(tdacc, 1)
                existing["stats"]["tddef"]  = round(tddef, 1)
                existing["stats"]["subavg"] = round(subavg, 2)
                updated += 1
            else:
                db[name] = {
                    "name": name,
                    "record": f"{wins}-{losses}",
                    "rank": "NR",
                    "country": "🌍",
                    "age": 28,
                    "weightClass": "Unknown",
                    "naturalWeight": nat_wt,
                    "reach": reach_in,
                    "style": "Mixed",
                    "wrestlerResilience": 5,
                    "reachDisadvantageHandling": 5,
                    "speedVsHandsHandling": 5,
                    "tendencies": [],
                    "stats": {
                        "slpm":   round(slpm, 2),
                        "stracc": round(stracc, 1),
                        "sapm":   round(sapm, 2),
                        "strdef": round(strdef, 1),
                        "tdavg":  round(tdavg, 2),
                        "tdacc":  round(tdacc, 1),
                        "tddef":  round(tddef, 1),
                        "subavg": round(subavg, 2),
                        "winStreak": 0,
                        "finishRate": 50,
                    }
                }
                added += 1

        except Exception as e:
            print(f"  [WARN] {name}: {e}")

        time.sleep(0.4)

    fighters_path.write_text(json.dumps(db, indent=2))
    print(f"UFC Stats scrape complete: {added} added, {updated} updated. Total: {len(db)} fighters.")


def fetch_espn_roster():
    """
    Fetch all active UFC fighters from ESPN and merge into fighters.json.
    ESPN athlete list: /apis/site/v2/sports/mma/ufc/athletes?limit=500
    ESPN athlete stats: /apis/common/v3/sports/mma/ufc/athletes/{id}/stats
    """
    fighters_path = DATA_DIR / "fighters.json"
    db = json.loads(fighters_path.read_text()) if fighters_path.exists() else {}

    # Fetch full roster
    url = "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/athletes?limit=500&active=true"
    print(f"Fetching roster from ESPN...")
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Accept": "application/json",
        })
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read())
    except Exception as e:
        print(f"[FAIL] Could not fetch roster: {e}")
        return

    athletes = data.get("items") or data.get("athletes") or []
    print(f"Found {len(athletes)} athletes on ESPN roster")

    added = 0
    updated = 0

    for athlete in athletes:
        aid = str(athlete.get("id", ""))
        name = athlete.get("displayName") or athlete.get("fullName") or ""
        if not name or not aid:
            continue

        # Fetch stats for this athlete
        stats_url = f"https://site.web.api.espn.com/apis/common/v3/sports/mma/ufc/athletes/{aid}/stats"
        try:
            req2 = urllib.request.Request(stats_url, headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                "Accept": "application/json",
            })
            with urllib.request.urlopen(req2, timeout=10) as resp2:
                sdata = json.loads(resp2.read())
        except Exception:
            sdata = {}

        cats = (sdata.get("splits") or {}).get("categories") or []

        def get_stat(cat_name, stat_name):
            for c in cats:
                if c.get("name","").lower() == cat_name.lower() or c.get("displayName","").lower() == cat_name.lower():
                    for s in c.get("stats", []):
                        if s.get("name","").lower() == stat_name.lower() or s.get("displayName","").lower() == stat_name.lower():
                            try: return float(s["value"])
                            except: pass
            return None

        slpm   = get_stat("striking","strikesLandedPerMinute") or get_stat("Striking","SLpM") or 3.5
        stracc = get_stat("striking","strikingAccuracy") or get_stat("Striking","strAcc") or 45.0
        sapm   = get_stat("striking","strikesAbsorbedPerMinute") or get_stat("Striking","SApM") or 3.0
        strdef = get_stat("striking","strikingDefense") or get_stat("Striking","strDef") or 55.0
        tdavg  = get_stat("grappling","takedownAverage") or get_stat("Grappling","TDAvg") or 1.0
        tdacc  = get_stat("grappling","takedownAccuracy") or get_stat("Grappling","TDAcc") or 40.0
        tddef  = get_stat("grappling","takedownDefense") or get_stat("Grappling","TDDef") or 60.0
        subavg = get_stat("grappling","submissionAverage") or get_stat("Grappling","subAvg") or 0.3

        # Normalize percentages ESPN sometimes returns as 0-1
        if stracc <= 1: stracc *= 100
        if strdef <= 1: strdef *= 100
        if tdacc  <= 1: tdacc  *= 100
        if tddef  <= 1: tddef  *= 100

        rec = athlete.get("record") or {}
        wins   = int(rec.get("wins", 0))
        losses = int(rec.get("losses", 0))
        record_str = f"{wins}-{losses}"

        wc = (athlete.get("weightClass") or {})
        wc_name = wc.get("displayName") or wc.get("name") or "Unknown"
        nat_wt  = wc.get("weightLimit") or 155

        age = athlete.get("age")
        try: age = int(age)
        except: age = 28

        reach = athlete.get("reach") or 70

        existing = db.get(name)
        if existing:
            # Only update record and stats, preserve curated fields
            existing["record"] = record_str
            existing["stats"]["slpm"]   = round(slpm, 2)
            existing["stats"]["stracc"] = round(stracc, 1)
            existing["stats"]["sapm"]   = round(sapm, 2)
            existing["stats"]["strdef"] = round(strdef, 1)
            existing["stats"]["tdavg"]  = round(tdavg, 2)
            existing["stats"]["tdacc"]  = round(tdacc, 1)
            existing["stats"]["tddef"]  = round(tddef, 1)
            existing["stats"]["subavg"] = round(subavg, 2)
            updated += 1
        else:
            db[name] = {
                "name": name,
                "record": record_str,
                "rank": "NR",
                "country": "🌍",
                "age": age,
                "weightClass": wc_name,
                "naturalWeight": nat_wt,
                "reach": int(reach) if reach else 70,
                "style": "Mixed",
                "wrestlerResilience": 5,
                "reachDisadvantageHandling": 5,
                "speedVsHandsHandling": 5,
                "tendencies": [],
                "stats": {
                    "slpm":   round(slpm, 2),
                    "stracc": round(stracc, 1),
                    "sapm":   round(sapm, 2),
                    "strdef": round(strdef, 1),
                    "tdavg":  round(tdavg, 2),
                    "tdacc":  round(tdacc, 1),
                    "tddef":  round(tddef, 1),
                    "subavg": round(subavg, 2),
                    "winStreak": 0,
                    "finishRate": 50,
                }
            }
            added += 1

        time.sleep(0.3)

    fighters_path.write_text(json.dumps(db, indent=2))
    print(f"Roster update complete: {added} added, {updated} updated. Total: {len(db)} fighters.")


# ─── MAIN ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="UFC Data Auto-Updater")
    parser.add_argument("--records", action="store_true", help="Update fighter records from ESPN")
    parser.add_argument("--events",  action="store_true", help="Update upcoming/past events")
    parser.add_argument("--resolve", action="store_true", help="Resolve past fight results")
    parser.add_argument("--images",  action="store_true", help="Download fighter images from UFC CDN")
    parser.add_argument("--force-images", action="store_true", help="Re-download all images even if they exist")
    parser.add_argument("--roster",  action="store_true", help="Fetch full UFC roster + stats from ufcstats.com")
    parser.add_argument("--all",     action="store_true", help="Run all updates")
    parser.add_argument("--fighter", type=str, help="Download image for a specific fighter only")
    args = parser.parse_args()

    if not any([args.records, args.events, args.resolve, args.images, args.force_images, args.all, args.fighter, args.roster]):
        parser.print_help()
        sys.exit(0)

    if args.roster:
        print("\n=== Fetching full UFC roster + stats from ufcstats.com ===")
        fetch_ufcstats_roster()

    if args.all or args.records:
        print("\n=== Updating fighter records ===")
        update_fighter_records()

    if args.all or args.events:
        print("\n=== Updating upcoming events ===")
        update_upcoming_events()

    if args.all or args.resolve:
        print("\n=== Resolving past fight results ===")
        resolve_past_events()

    if args.all or args.images or args.force_images:
        fighters_list = [args.fighter] if args.fighter else None
        print("\n=== Downloading fighter images ===")
        download_fighter_images(fighters=fighters_list, force=args.force_images)

    print("\nDone.")


if __name__ == "__main__":
    main()
