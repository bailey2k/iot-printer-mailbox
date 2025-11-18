import subprocess
import time
import requests
from datetime import datetime
from config import SERVER_URL, USERNAME, POLL_INTERVAL

PRINTER_NAME = "-"

def fetch_messages():
    try:
        resp = requests.get(f"{SERVER_URL}/messages/{USERNAME}", timeout=5)
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        print("Error fetching messages:", e)
    return []

def print_message(sender, text):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    content = f"YOU'VE GOT MAIL!\n{timestamp}\nFROM: {sender}\n{text}\n\n\n"
    try:
        subprocess.run(["lp", "-d", PRINTER_NAME], input=content.encode(), check=True)
        msg_id = text.get("_id") if isinstance(text, dict) and "_id" in text else None
        if msg_id:
            requests.post(f"{SERVER_URL}/delivered/{msg_id}", timeout=5)
    except Exception as e:
        print("Print error:", e)

    try:
        resp = requests.get(f'{SERVER_URL}/delivered/:')

def main():
    print(f"Mailbox started for {USERNAME}. Polling {SERVER_URL} every {POLL_INTERVAL} seconds.")
    while True:
        messages = fetch_messages()
        for msg in messages:
            print_message(msg['sender'], msg['text'])
        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()
