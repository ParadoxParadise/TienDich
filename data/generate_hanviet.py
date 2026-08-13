import os

def generate_hanviet():
    vietphrase_path = r"e:\Promt\novel-translator\data\Vietphrase.txt"
    hanviet_path = r"e:\Promt\novel-translator\data\HanViet.txt"
    
    hanviet_dict = {}
    
    try:
        with open(vietphrase_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or '=' not in line:
                    continue
                parts = line.split('=', 1)
                zh = parts[0].strip()
                vi = parts[1].strip()
                
                if len(zh) == 1:
                    # Taking the first meaning as Han Viet
                    first_meaning = vi.split('/')[0].split(',')[0].strip()
                    if zh not in hanviet_dict:
                        hanviet_dict[zh] = first_meaning
                        
        print(f"Extracted {len(hanviet_dict)} single characters.")
        
        with open(hanviet_path, 'w', encoding='utf-8') as f:
            for zh, vi in sorted(hanviet_dict.items()):
                f.write(f"{zh}={vi}\n")
                
        print("HanViet.txt generated successfully.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    generate_hanviet()
