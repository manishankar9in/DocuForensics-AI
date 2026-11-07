import os
from pathlib import Path
import pymupdf as fitz
from PIL import Image, ImageDraw, ImageFont

sample_dir = Path("sample_data")
sample_dir.mkdir(parents=True, exist_ok=True)

# 1. Invoice Vendor A (Original PDF)
doc1 = fitz.open()
page1 = doc1.new_page(width=595, height=842) # A4

# Write invoice text
text1 = """
APEX LOGISTICS LLC
100 Industrial Parkway, Suite 400
Chicago, IL 60601

INVOICE

Invoice Number: INV-8891
Date: 2026-11-02
Due Date: 2026-12-02

Bill To:
Metro Distribution Corp
550 Enterprise Way
Dallas, TX 75201

Line Items:
1. Freight Transit Cargo - Standard Route: $10,000.00
2. Express Handling & Fuel Surcharge: $3,000.00
3. Regional Compliance & State Tax: $1,500.00

Total Amount: $14,500.00

Payment Terms: Net 30 days. Wire transfer to Account # 9882-10029.
Thank you for your business.
"""

page1.insert_text((50, 60), text1, fontsize=12, fontname="helv", color=(0.1, 0.1, 0.15))
doc1.set_metadata({
    "producer": "Adobe PDF Library 15.0",
    "creator": "QuickBooks Enterprise 2026",
    "creationDate": "D:20261102100000Z",
    "modDate": "D:20261102100000Z"
})
doc1.save(sample_dir / "invoice_vendor_a.pdf")
doc1.close()
print("Created sample_data/invoice_vendor_a.pdf")

# 2. Bank Deposit Slip / Voucher (PNG Image)
# 800 x 600 image
img2 = Image.new("RGB", (800, 600), color=(255, 255, 255))
draw = ImageDraw.draw = ImageDraw.Draw(img2)

# Draw simulated bank slip header
draw.rectangle([(20, 20), (780, 80)], fill=(230, 240, 250), outline=(50, 80, 140), width=2)
draw.text((40, 35), "FIRST HORIZON COMMERCIAL BANK - DEPOSIT VOUCHER", fill=(20, 40, 90))

# Slip body
slip_text = [
    ("Transaction Reference:", "DEP-2026-9021"),
    ("Customer Account:", "Metro Distribution Corp"),
    ("Remitter / Payee:", "Apex Logistics LLC"),
    ("Invoice Reference:", "INV-8891"),
    ("Transaction Date:", "2026-11-03"),
    ("Deposit Total Amount:", "$11,500.00"),
    ("Status:", "CLEARED - FUNDS POSTED")
]

y_pos = 120
for label, val in slip_text:
    draw.text((50, y_pos), label, fill=(80, 90, 100))
    draw.text((260, y_pos), val, fill=(10, 20, 30))
    draw.line([(50, y_pos + 25), (750, y_pos + 25)], fill=(220, 225, 230), width=1)
    y_pos += 45

img2.save(sample_dir / "bank_deposit_slip.png")
print("Created sample_data/bank_deposit_slip.png")

# 3. Altered Invoice with Canva / Consumer editor metadata & future date
doc3 = fitz.open()
page3 = doc3.new_page(width=595, height=842)

text3 = """
APEX LOGISTICS LLC
100 Industrial Parkway, Suite 400
Chicago, IL 60601

INVOICE

Invoice Number: INV-8891-ALT
Date: 2027-01-15
Total Amount: $18,900.00

Bill To:
Metro Distribution Corp
"""
page3.insert_text((50, 60), text3, fontsize=12, fontname="helv", color=(0.1, 0.1, 0.15))
doc3.set_metadata({
    "producer": "Canva PDF Generator v2",
    "creator": "Canva Online Editor",
    "creationDate": "D:20261102100000Z",
    "modDate": "D:20261108143000Z" # Modified significantly later
})
doc3.save(sample_dir / "invoice_modified_canva.pdf")
doc3.close()
print("Created sample_data/invoice_modified_canva.pdf")

