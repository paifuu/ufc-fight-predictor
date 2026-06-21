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
    ufcstats.com uses a JS proof-of-work bot challenge; we solve it in Python.
    """
    import hashlib
    import http.cookiejar
    import urllib.parse
    fighters_path = DATA_DIR / "fighters.json"
    db = json.loads(fighters_path.read_text()) if fighters_path.exists() else {}

    BASE = "http://www.ufcstats.com"
    jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    hdrs = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }

    def solve_pow(html):
        """Solve the SHA-256 proof-of-work challenge to get bypass cookie."""
        nonce_m = re.search(r'var nonce="([^"]+)"', html)
        target_m = re.search(r'target=new Array\((\d+)\+1\)\.join', html)
        if not nonce_m or not target_m:
            return False
        nonce = nonce_m.group(1)
        target_len = int(target_m.group(1))
        target = "0" * target_len
        n = 0
        while True:
            h = hashlib.sha256(f"{nonce}:{n}".encode()).hexdigest()
            if h[:target_len] == target:
                break
            n += 1
        print(f"  PoW solved: nonce={nonce} n={n} hash={h[:8]}...", flush=True)
        body = f"nonce={urllib.parse.quote(nonce)}&n={n}".encode()
        req = urllib.request.Request(
            f"{BASE}/__c",
            data=body,
            headers={**hdrs, "Content-Type": "application/x-www-form-urlencoded"},
        )
        try:
            opener.open(req, timeout=10)
            return True
        except Exception as e:
            print(f"  [WARN] PoW POST failed: {e}", flush=True)
            return False

    def fetch_html(url):
        req = urllib.request.Request(url, headers=hdrs)
        with opener.open(req, timeout=20) as r:
            raw = r.read()
            import gzip as _gz
            try:
                return _gz.decompress(raw).decode("utf-8", errors="replace")
            except Exception:
                return raw.decode("utf-8", errors="replace")

    # Solve the JS challenge once to get the bypass cookie
    print("Solving ufcstats.com bot challenge...", flush=True)
    try:
        challenge_html = fetch_html(f"{BASE}/statistics/fighters?char=a&page=all")
        if "sha256" in challenge_html or "Checking your browser" in challenge_html:
            ok = solve_pow(challenge_html)
            print(f"  Challenge {'solved' if ok else 'FAILED'}", flush=True)
        else:
            print("  No challenge detected on first fetch.", flush=True)
    except Exception as e:
        print(f"  [WARN] Initial fetch failed: {e}", flush=True)

    # Step 1: collect all fighter detail page URLs from the A-Z list
    fighter_urls = {}  # name -> url
    print("Collecting fighter list from ufcstats.com...", flush=True)
    for char in "abcdefghijklmnopqrstuvwxyz":
        try:
            html = fetch_html(f"{BASE}/statistics/fighters?char={char}&page=all")
            all_links = re.findall(
                r'href="(https?://www\.ufcstats\.com/fighter-details/[^"]+)"[^>]*>\s*([^<\s][^<]*?)\s*</a>',
                html
            )
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
            print(f"  char={char}: {len(fighter_urls)} total ({len(all_links)} links)", flush=True)
        except Exception as e:
            print(f"  [WARN] Failed on char={char}: {e}", flush=True)
        time.sleep(0.3)

    print(f"Found {len(fighter_urls)} fighters on ufcstats.com")

    # Helper: map weight (lbs) to UFC weight class name
    def weight_to_class(wt, name_hint=""):
        # Detect women's fighters by common women's weights
        # ufcstats uses same weights for men/women so we check both
        # Women's divisions: 105,115,125,135,145
        # Men's divisions: 125,135,145,155,170,185,205,265
        wt = int(wt)
        # Strawweight only exists for women
        if wt <= 116:   return "Women's Strawweight"
        if wt <= 126:   return "Flyweight"       # could be W Flyweight, no good signal
        if wt <= 136:   return "Bantamweight"    # could be W Bantamweight
        if wt <= 146:   return "Featherweight"   # could be W Featherweight
        if wt <= 156:   return "Lightweight"
        if wt <= 171:   return "Welterweight"
        if wt <= 186:   return "Middleweight"
        if wt <= 206:   return "Light Heavyweight"
        return "Heavyweight"

    # Helper: derive fighting style from stats
    def derive_style(slpm, tdavg, subavg, stracc):
        if subavg >= 1.5:                          return "BJJ"
        if tdavg >= 3.0 and subavg >= 0.8:         return "Wrestler/BJJ"
        if tdavg >= 2.5:                           return "Wrestler"
        if slpm >= 5.5 and tdavg < 1.0:            return "Striker"
        if slpm >= 4.5 and stracc >= 50:           return "Kickboxer"
        if slpm >= 4.0 and tdavg < 1.5:            return "Boxer"
        if tdavg >= 1.5 and subavg >= 0.5:         return "Grappler"
        return "Mixed"

    # Step 2: for each fighter in our DB, scrape their career stats from ufcstats
    added = updated = 0
    for name, url in fighter_urls.items():
        try:
            html = fetch_html(url)

            def get_stat(label, _html=html):
                m = re.search(
                    r'<i[^>]*>\s*' + re.escape(label) + r'\s*</i>\s*([\d.]+)',
                    _html, re.IGNORECASE
                )
                if m:
                    try: return float(m.group(1))
                    except: pass
                return None

            def pct_stat(label, default, _html=html):
                m = re.search(r'<i[^>]*>\s*' + re.escape(label) + r'\s*</i>\s*([\d.]+)\s*%?', _html, re.IGNORECASE)
                if m:
                    try: return float(m.group(1))
                    except: pass
                return default

            slpm   = get_stat("SLpM:")     or 3.5
            stracc = pct_stat("Str. Acc.:", 45.0)
            sapm   = get_stat("SApM:")     or 3.0
            strdef = pct_stat("Str. Def.:", 55.0)
            tdavg  = get_stat("TD Avg.:")  or 1.0
            tdacc  = pct_stat("TD Acc.:",  40.0)
            tddef  = pct_stat("TD Def.:",  60.0)
            subavg = get_stat("Sub. Avg.:") or 0.3

            # Record: "Record: W-L-D" at top of page
            rec_m = re.search(r'Record:\s*(\d+)-(\d+)', html, re.IGNORECASE)
            if rec_m:
                wins, losses = int(rec_m.group(1)), int(rec_m.group(2))
            else:
                # Fallback: span-based
                wins_m   = re.search(r'<span[^>]*>(\d+)</span>\s*<span[^>]*>Wins',   html)
                losses_m = re.search(r'<span[^>]*>(\d+)</span>\s*<span[^>]*>Losses', html)
                wins   = int(wins_m.group(1))   if wins_m   else 0
                losses = int(losses_m.group(1)) if losses_m else 0

            # Finish rate: count KO/TKO and Sub wins from the win breakdown section
            ko_m  = re.search(r'<span[^>]*>(\d+)</span>\s*<span[^>]*>[^<]*KO/TKO', html, re.IGNORECASE)
            sub_m = re.search(r'<span[^>]*>(\d+)</span>\s*<span[^>]*>[^<]*Sub(?:mission)?', html, re.IGNORECASE)
            ko_count  = int(ko_m.group(1))  if ko_m  else 0
            sub_count = int(sub_m.group(1)) if sub_m else 0
            # If span approach found nothing, fall back to counting in fight table rows
            if ko_count == 0 and sub_count == 0 and wins > 0:
                ko_count  = len(re.findall(r'\bKO/TKO\b', html))
                sub_count = len(re.findall(r'\bSub(?:mission)?\b', html, re.IGNORECASE))
                # These counts include headers/labels so cap at wins
                ko_count  = min(ko_count,  wins)
                sub_count = min(sub_count, wins - ko_count)
            finish_rate = round((ko_count + sub_count) / wins * 100) if wins > 0 else 50
            finish_rate = max(0, min(100, finish_rate))

            # Reach: e.g. <i ...>Reach:</i>  74"
            reach_m = re.search(r'Reach:</i>\s*([\d.]+)"', html, re.IGNORECASE)
            reach_in = int(float(reach_m.group(1))) if reach_m else 70

            # Weight: e.g. <i ...>Weight:</i>  185 lbs.
            wt_m = re.search(r'Weight:</i>\s*(\d+)\s*lbs', html, re.IGNORECASE)
            nat_wt = int(wt_m.group(1)) if wt_m else 155

            # Weight class derived from weight
            wt_class = weight_to_class(nat_wt)

            # Age from DOB: e.g. <i ...>DOB:</i>  Jul 19, 1987
            age = 28
            dob_m = re.search(r'DOB:</i>\s*([A-Za-z]+\.?\s+\d{1,2},\s*(\d{4}))', html, re.IGNORECASE)
            if dob_m:
                try:
                    import datetime
                    birth_year = int(dob_m.group(2))
                    age = datetime.date.today().year - birth_year
                except Exception:
                    pass

            # Style auto-derived from stats
            style = derive_style(slpm, tdavg, subavg, stracc)

            # Past matchups: parse fight history table rows
            # Each row: result cell (win/loss/draw/nc) + opponent name cell
            past_matchups = {}
            row_pattern = re.compile(
                r'<i[^>]*>\s*(win|loss|draw|no contest)\s*</i>'   # result
                r'(?:(?!<tr).)*?'                                  # skip to opponent
                r'<a[^>]+href="[^"]*fighter-details[^"]*"[^>]*>\s*([^<]+?)\s*</a>',
                re.IGNORECASE | re.DOTALL
            )
            for m in row_pattern.finditer(html):
                outcome = m.group(1).strip().lower()
                opponent = m.group(2).strip()
                if not opponent or len(opponent) < 3:
                    continue
                if outcome == "win":
                    past_matchups[opponent] = "W"
                elif outcome == "loss":
                    past_matchups[opponent] = "L"
                # draw/NC: omit (no useful signal)

            existing = db.get(name)
            if existing:
                existing["record"] = f"{wins}-{losses}"
                existing["age"]    = age
                existing["reach"]  = reach_in
                existing["naturalWeight"] = nat_wt
                # Only overwrite weightClass/style if they're still defaults
                if existing.get("weightClass") in ("Unknown", None):
                    existing["weightClass"] = wt_class
                if existing.get("style") in ("Mixed", None):
                    existing["style"] = style
                existing["stats"]["slpm"]       = round(slpm, 2)
                existing["stats"]["stracc"]     = round(stracc, 1)
                existing["stats"]["sapm"]       = round(sapm, 2)
                existing["stats"]["strdef"]     = round(strdef, 1)
                existing["stats"]["tdavg"]      = round(tdavg, 2)
                existing["stats"]["tdacc"]      = round(tdacc, 1)
                existing["stats"]["tddef"]      = round(tddef, 1)
                existing["stats"]["subavg"]     = round(subavg, 2)
                existing["stats"]["finishRate"] = finish_rate
                # Merge past matchups — scraped data wins over old hand-curated
                if past_matchups:
                    existing.setdefault("pastMatchups", {}).update(past_matchups)
                updated += 1
            else:
                db[name] = {
                    "name": name,
                    "record": f"{wins}-{losses}",
                    "rank": "NR",
                    "country": "🌍",
                    "age": age,
                    "weightClass": wt_class,
                    "naturalWeight": nat_wt,
                    "reach": reach_in,
                    "style": style,
                    "wrestlerResilience": 5,
                    "reachDisadvantageHandling": 5,
                    "speedVsHandsHandling": 5,
                    "tendencies": [],
                    "pastMatchups": past_matchups,
                    "stats": {
                        "slpm":       round(slpm, 2),
                        "stracc":     round(stracc, 1),
                        "sapm":       round(sapm, 2),
                        "strdef":     round(strdef, 1),
                        "tdavg":      round(tdavg, 2),
                        "tdacc":      round(tdacc, 1),
                        "tddef":      round(tddef, 1),
                        "subavg":     round(subavg, 2),
                        "winStreak":  0,
                        "finishRate": finish_rate,
                    }
                }
                added += 1
        except Exception as e:
            print(f"  [WARN] {name}: {e}", flush=True)
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
