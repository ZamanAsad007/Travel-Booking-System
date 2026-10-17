#!/usr/bin/env python3
import os
import shutil
import subprocess
from PIL import Image, ImageDraw, ImageFont

WIDTH = 1040
HEIGHT = 650

FONT_BOLD = "/usr/share/fonts/julietaula-montserrat-fonts/Montserrat-Bold.otf"
FONT_REG = "/usr/share/fonts/julietaula-montserrat-fonts/Montserrat-Regular.otf"
FONT_MONO = "/usr/share/fonts/adobe-source-code-pro-fonts/SourceCodePro-Bold.otf"

def get_font(size, bold=False, mono=False):
    path = FONT_MONO if mono else (FONT_BOLD if bold else FONT_REG)
    return ImageFont.truetype(path, size)

def draw_window_chrome(draw, title="https://travelgo.local"):
    # Window background
    draw.rounded_rectangle([20, 20, WIDTH - 20, HEIGHT - 20], radius=16, fill="#0F172A", outline="#334155", width=2)
    # Title bar
    draw.rounded_rectangle([20, 20, WIDTH - 20, 65], radius=16, fill="#1E293B")
    draw.rectangle([20, 50, WIDTH - 20, 65], fill="#1E293B")
    
    # Mac buttons
    draw.ellipse([40, 36, 52, 48], fill="#EF4444")
    draw.ellipse([60, 36, 72, 48], fill="#F59E0B")
    draw.ellipse([80, 36, 92, 48], fill="#10B981")
    
    # Address bar
    draw.rounded_rectangle([260, 31, WIDTH - 260, 55], radius=8, fill="#0F172A", outline="#334155", width=1)
    draw.text((280, 36), title, font=get_font(13), fill="#94A3B8")
    
    # Inner Canvas area
    draw.rectangle([22, 66, WIDTH - 22, HEIGHT - 22], fill="#F8FAFC")

def draw_app_navbar(draw, active_tab="flights"):
    # Navbar container
    draw.rectangle([22, 66, WIDTH - 22, 126], fill="#0B2545")
    
    # Logo
    draw.text((45, 83), "TravelGo", font=get_font(22, bold=True), fill="#FFFFFF")
    draw.text((155, 87), "FLIGHTS & HOTELS", font=get_font(10, bold=True), fill="#F5B83D")
    
    # Nav links
    nav_items = [
        ("Flights", "/flights", active_tab == "flights"),
        ("Hotels", "/hotels", active_tab == "hotels"),
        ("Deals & Packages", "/flights?deal=bundle", active_tab == "deals"),
        ("My Bookings", "/bookings", active_tab == "bookings"),
    ]
    
    x = 320
    for label, link, is_active in nav_items:
        color = "#FF6B4A" if is_active else "#E2E8F0"
        draw.text((x, 88), label, font=get_font(14, bold=is_active), fill=color)
        if is_active:
            draw.rectangle([x, 122, x + len(label) * 8.5, 125], fill="#FF6B4A")
        x += len(label) * 9.5 + 28
        
    # User / Loyalty Pill
    draw.rounded_rectangle([WIDTH - 215, 80, WIDTH - 45, 112], radius=16, fill="#0F766E")
    draw.text((WIDTH - 200, 88), "Gold Member - 2,450 pts", font=get_font(11, bold=True), fill="#FFFFFF")

def draw_stepper(draw, current_step=1, total_steps=6, step_title=""):
    draw.rectangle([22, 127, WIDTH - 22, 167], fill="#F1F5F9")
    draw.text((45, 137), f"SYSTEM WORKFLOW DEMO • STEP {current_step} OF {total_steps}: {step_title}", font=get_font(12, bold=True), fill="#0F766E")
    
    # Step progress pills
    start_x = WIDTH - 230
    for s in range(1, total_steps + 1):
        color = "#0F766E" if s <= current_step else "#CBD5E1"
        draw.rounded_rectangle([start_x + (s - 1) * 30, 140, start_x + (s - 1) * 30 + 22, 154], radius=4, fill=color)
        draw.text((start_x + (s - 1) * 30 + 6, 141), str(s), font=get_font(10, bold=True), fill="#FFFFFF" if s <= current_step else "#475569")

# --- SCENE 1: Route Search & Vacation Packages Tab ---
def render_scene_1():
    img = Image.new("RGB", (WIDTH, HEIGHT), "#020617")
    draw = ImageDraw.Draw(img)
    draw_window_chrome(draw, "https://travelgo.local")
    draw_app_navbar(draw, active_tab="flights")
    draw_stepper(draw, 1, 6, "56-Route Global Flight & Vacation Package Search")
    
    # Hero Banner
    draw.rounded_rectangle([45, 185, WIDTH - 45, 305], radius=12, fill="#0B2545")
    draw.rounded_rectangle([65, 198, 255, 222], radius=12, fill="#0F766E")
    draw.text((75, 203), "* ALL 56 ROUTES AVAILABLE", font=get_font(10, bold=True), fill="#FFFFFF")
    
    draw.text((65, 230), "Where will your journey take you?", font=get_font(24, bold=True), fill="#FFFFFF")
    draw.text((65, 268), "Explore live scheduled flights across 56 international airport pairs with zero-overbooking Redis seat holds.", font=get_font(13), fill="#94A3B8")
    
    # Search Box Card
    draw.rounded_rectangle([45, 325, WIDTH - 45, 600], radius=14, fill="#FFFFFF", outline="#E2E8F0", width=2)
    
    # Mode Tabs
    tabs = [("Flights (56 Direct Routes)", True), ("Luxury Hotels", False), ("Vacation Packages (Save 15%)", False)]
    tx = 65
    for tab_label, is_act in tabs:
        bg = "#0F766E" if is_act else "#F1F5F9"
        fg = "#FFFFFF" if is_act else "#475569"
        draw.rounded_rectangle([tx, 345, tx + len(tab_label) * 9 + 30, 380], radius=8, fill=bg)
        draw.text((tx + 15, 355), tab_label, font=get_font(13, bold=True), fill=fg)
        tx += len(tab_label) * 9 + 45
        
    # Inputs Grid
    # Origin
    draw.rounded_rectangle([65, 405, 340, 485], radius=8, fill="#F8FAFC", outline="#0F766E", width=2)
    draw.text((80, 415), "FROM (ORIGIN)", font=get_font(10, bold=True), fill="#0F766E")
    draw.text((80, 438), "New York (JFK)", font=get_font(16, bold=True), fill="#0F172A")
    draw.text((80, 462), "John F. Kennedy Intl", font=get_font(11), fill="#64748B")
    
    # Arrow icon
    draw.ellipse([355, 430, 385, 460], fill="#0F766E")
    draw.text((360, 436), "<->", font=get_font(14, bold=True), fill="#FFFFFF")
    
    # Destination
    draw.rounded_rectangle([400, 405, 675, 485], radius=8, fill="#F8FAFC", outline="#CBD5E1", width=1)
    draw.text((415, 415), "TO (DESTINATION)", font=get_font(10, bold=True), fill="#475569")
    draw.text((415, 438), "London Heathrow (LHR)", font=get_font(16, bold=True), fill="#0F172A")
    draw.text((415, 462), "United Kingdom", font=get_font(11), fill="#64748B")
    
    # Date
    draw.rounded_rectangle([695, 405, 965, 485], radius=8, fill="#F8FAFC", outline="#CBD5E1", width=1)
    draw.text((710, 415), "DEPARTURE DATE", font=get_font(10, bold=True), fill="#475569")
    draw.text((710, 438), "Saturday, Oct 17, 2026", font=get_font(15, bold=True), fill="#0F172A")
    draw.text((710, 462), "Live 7-Day Fare Comparison", font=get_font(11), fill="#0F766E")
    
    # Action Button
    draw.rounded_rectangle([65, 510, WIDTH - 65, 565], radius=10, fill="#FF6B4A")
    draw.text((410, 526), "Search Available Flights & Fares >", font=get_font(16, bold=True), fill="#FFFFFF")
    
    return img

# --- SCENE 2: Flight Results & 7-Day Fare Strip ---
def render_scene_2():
    img = Image.new("RGB", (WIDTH, HEIGHT), "#020617")
    draw = ImageDraw.Draw(img)
    draw_window_chrome(draw, "https://travelgo.local/flights?from=JFK&to=LHR&date=2026-10-17")
    draw_app_navbar(draw, active_tab="flights")
    draw_stepper(draw, 2, 6, "Live 7-Day Fare Strip Calendar & Instant Inventory Lookup")
    
    # Results Header Bar
    draw.rounded_rectangle([45, 185, WIDTH - 45, 235], radius=8, fill="#0B2545")
    draw.text((65, 198), "JFK", font=get_font(18, bold=True), fill="#FFFFFF")
    draw.text((115, 201), "----------------->", font=get_font(14, bold=True), fill="#38BDF8")
    draw.text((285, 198), "LHR", font=get_font(18, bold=True), fill="#FFFFFF")
    draw.text((350, 202), "• Sat, Oct 17, 2026 • 2 Daily Departures • 15% Combo Deal Eligible", font=get_font(12), fill="#94A3B8")
    draw.rounded_rectangle([WIDTH - 180, 193, WIDTH - 65, 227], radius=6, fill="#0F766E")
    draw.text((WIDTH - 165, 202), "Modify Search", font=get_font(12, bold=True), fill="#FFFFFF")
    
    # 7-Day Fare Strip Calendar Container
    draw.rounded_rectangle([45, 250, WIDTH - 45, 375], radius=10, fill="#FFFFFF", outline="#E2E8F0", width=1)
    draw.text((65, 260), "7-Day Fare Calendar", font=get_font(13, bold=True), fill="#0F766E")
    draw.text((230, 261), "Select any date to instantly load live scheduled flights", font=get_font(12), fill="#64748B")
    
    # Calendar Controls
    draw.rounded_rectangle([WIDTH - 240, 256, WIDTH - 170, 280], radius=4, fill="#F1F5F9", outline="#CBD5E1")
    draw.text((WIDTH - 232, 262), "< Prev Wk", font=get_font(10, bold=True), fill="#475569")
    draw.rounded_rectangle([WIDTH - 160, 256, WIDTH - 90, 280], radius=4, fill="#F1F5F9", outline="#CBD5E1")
    draw.text((WIDTH - 152, 262), "Next Wk >", font=get_font(10, bold=True), fill="#475569")
    
    # 7 Days Cards
    fare_days = [
        ("Today", "Oct 17", "$550", True, True),
        ("Sun", "Oct 18", "$578", False, False),
        ("Mon", "Oct 19", "$550", False, False),
        ("Tue", "Oct 20", "$540", False, True),
        ("Wed", "Oct 21", "$550", False, False),
        ("Thu", "Oct 22", "$550", False, False),
        ("Fri", "Oct 23", "$578", False, False),
    ]
    
    cx = 65
    card_w = 120
    for day_name, date_lbl, price_val, is_sel, is_best in fare_days:
        bg = "#F0FDFA" if is_sel else "#FFFFFF"
        border = "#0F766E" if is_sel else "#E2E8F0"
        thick = 2 if is_sel else 1
        draw.rounded_rectangle([cx, 290, cx + card_w, 362], radius=8, fill=bg, outline=border, width=thick)
        
        if is_best:
            draw.rounded_rectangle([cx + 25, 283, cx + card_w - 25, 297], radius=6, fill="#10B981")
            draw.text((cx + 33, 285), "BEST FARE", font=get_font(8, bold=True), fill="#FFFFFF")
            
        draw.text((cx + 42, 303), day_name, font=get_font(11, bold=True), fill="#0F766E" if is_sel else "#64748B")
        draw.text((cx + 38, 319), date_lbl, font=get_font(12, bold=True), fill="#0F172A")
        draw.text((cx + 36, 337), price_val, font=get_font(15, bold=True), fill="#FF6B4A")
        cx += card_w + 14
        
    # Flight Ticket Card 1: American Airlines AA100-1017
    draw.rounded_rectangle([45, 390, WIDTH - 45, 505], radius=10, fill="#FFFFFF", outline="#E2E8F0", width=1)
    draw.rectangle([740, 390, 742, 505], fill="#E2E8F0")
    
    draw.text((65, 405), "American Airlines • [AA100-1017]", font=get_font(14, bold=True), fill="#0B2545")
    draw.rounded_rectangle([320, 403, 445, 423], radius=4, fill="#CCFBF1")
    draw.text((328, 407), "15% COMBO DEAL", font=get_font(9, bold=True), fill="#0F766E")
    
    draw.text((65, 435), "18:30 JFK", font=get_font(20, bold=True), fill="#0F172A")
    draw.text((65, 465), "New York (Direct)", font=get_font(12), fill="#64748B")
    
    draw.text((220, 442), "------- 7h 00m ------->", font=get_font(11, bold=True), fill="#0F766E")
    draw.text((250, 460), "Direct Non-Stop", font=get_font(10), fill="#94A3B8")
    
    draw.text((450, 435), "06:30+1 LHR", font=get_font(20, bold=True), fill="#0F172A")
    draw.text((450, 465), "London Heathrow", font=get_font(12), fill="#64748B")
    
    # Right stub
    draw.text((770, 410), "Price per passenger", font=get_font(10), fill="#64748B")
    draw.text((770, 430), "$550", font=get_font(26, bold=True), fill="#0F766E")
    draw.text((770, 465), "Includes taxes & fees", font=get_font(9), fill="#94A3B8")
    
    draw.rounded_rectangle([WIDTH - 150, 430, WIDTH - 65, 470], radius=6, fill="#FF6B4A")
    draw.text((WIDTH - 132, 443), "Select >", font=get_font(13, bold=True), fill="#FFFFFF")
    
    # Flight Ticket Card 2: British Airways BA178-1017
    draw.rounded_rectangle([45, 520, WIDTH - 45, 635], radius=10, fill="#FFFFFF", outline="#E2E8F0", width=1)
    draw.rectangle([740, 520, 742, 635], fill="#E2E8F0")
    
    draw.text((65, 535), "British Airways • [BA178-1017]", font=get_font(14, bold=True), fill="#0B2545")
    draw.rounded_rectangle([320, 533, 445, 553], radius=4, fill="#CCFBF1")
    draw.text((328, 537), "15% COMBO DEAL", font=get_font(9, bold=True), fill="#0F766E")
    
    draw.text((65, 565), "21:00 JFK", font=get_font(20, bold=True), fill="#0F172A")
    draw.text((65, 595), "New York (Direct)", font=get_font(12), fill="#64748B")
    
    draw.text((220, 572), "------- 7h 00m ------->", font=get_font(11, bold=True), fill="#0F766E")
    draw.text((250, 590), "Direct Non-Stop", font=get_font(10), fill="#94A3B8")
    
    draw.text((450, 565), "09:00+1 LHR", font=get_font(20, bold=True), fill="#0F172A")
    draw.text((450, 595), "London Heathrow", font=get_font(12), fill="#64748B")
    
    draw.text((770, 540), "Price per passenger", font=get_font(10), fill="#64748B")
    draw.text((770, 560), "$620", font=get_font(26, bold=True), fill="#0F766E")
    draw.text((770, 595), "Includes taxes & fees", font=get_font(9), fill="#94A3B8")
    
    draw.rounded_rectangle([WIDTH - 150, 560, WIDTH - 65, 600], radius=6, fill="#FF6B4A")
    draw.text((WIDTH - 132, 573), "Select >", font=get_font(13, bold=True), fill="#FFFFFF")
    
    return img

# --- SCENE 3: Vacation Package Deals (Flight + Hotel 15% Savings) ---
def render_scene_3():
    img = Image.new("RGB", (WIDTH, HEIGHT), "#020617")
    draw = ImageDraw.Draw(img)
    draw_window_chrome(draw, "https://travelgo.local/flights?deal=bundle")
    draw_app_navbar(draw, active_tab="deals")
    draw_stepper(draw, 3, 6, "Vacation Package Deals (Flight + 5-Star Hotel with 15% Combo Discount)")
    
    # Deals Header
    draw.rounded_rectangle([45, 180, WIDTH - 45, 260], radius=10, fill="#FFF7ED", outline="#FDBA74", width=1)
    draw.rounded_rectangle([65, 192, 230, 214], radius=6, fill="#EA580C")
    draw.text((75, 196), "* EXCLUSIVE BUNDLE ENGINE", font=get_font(10, bold=True), fill="#FFFFFF")
    draw.text((65, 224), "Flight + Hotel Combo Packages • Save 15% Automatically", font=get_font(20, bold=True), fill="#9A3412")
    draw.text((600, 227), "Combined saga transaction with unified checkout.", font=get_font(13), fill="#C2410C")
    
    # Bundle Card 1 (London Package)
    draw.rounded_rectangle([45, 280, 505, 590], radius=12, fill="#FFFFFF", outline="#0F766E", width=2)
    draw.rounded_rectangle([45, 280, 505, 320], radius=12, fill="#0F766E")
    draw.rectangle([45, 305, 505, 320], fill="#0F766E")
    draw.text((65, 292), "FEATURED BUNDLE • SAVE $123.00 (15% OFF)", font=get_font(12, bold=True), fill="#FFFFFF")
    
    draw.text((65, 335), "London Luxury Getaway", font=get_font(18, bold=True), fill="#0F172A")
    draw.text((65, 360), "JFK (New York) -> LHR (London)", font=get_font(13), fill="#64748B")
    
    # Flight detail in bundle
    draw.rounded_rectangle([65, 385, 485, 440], radius=6, fill="#F8FAFC", outline="#E2E8F0")
    draw.text((80, 395), "Flight: British Airways BA178", font=get_font(12, bold=True), fill="#0B2545")
    draw.text((80, 415), "Departs 21:00 • Arrives 09:00 • Seat Guaranteed", font=get_font(11), fill="#64748B")
    
    # Hotel detail in bundle
    draw.rounded_rectangle([65, 450, 485, 505], radius=6, fill="#F8FAFC", outline="#E2E8F0")
    draw.text((80, 460), "Hotel: The Savoy London (Deluxe King Room)", font=get_font(12, bold=True), fill="#0B2545")
    draw.text((80, 480), "4.8 Rating • Central London Strand • Breakfast included", font=get_font(11), fill="#64748B")
    
    # Price and CTA
    draw.text((65, 525), "Original: $820.00", font=get_font(12), fill="#94A3B8")
    draw.line([65, 532, 175, 532], fill="#EF4444", width=2)
    draw.text((65, 545), "$697.00", font=get_font(26, bold=True), fill="#EA580C")
    draw.text((185, 555), "Total Combo Price", font=get_font(11), fill="#64748B")
    
    draw.rounded_rectangle([320, 535, 485, 575], radius=8, fill="#FF6B4A")
    draw.text((345, 547), "Book Package >", font=get_font(13, bold=True), fill="#FFFFFF")
    
    # Bundle Card 2 (Paris Package)
    draw.rounded_rectangle([535, 280, WIDTH - 45, 590], radius=12, fill="#FFFFFF", outline="#E2E8F0", width=1)
    draw.rounded_rectangle([535, 280, WIDTH - 45, 320], radius=12, fill="#1E293B")
    draw.rectangle([535, 305, WIDTH - 45, 320], fill="#1E293B")
    draw.text((555, 292), "FEATURED BUNDLE • SAVE $117.00 (15% OFF)", font=get_font(12, bold=True), fill="#F8FAFC")
    
    draw.text((555, 335), "Paris Romantic Escape", font=get_font(18, bold=True), fill="#0F172A")
    draw.text((555, 360), "JFK (New York) -> CDG (Paris)", font=get_font(13), fill="#64748B")
    
    # Flight detail in bundle
    draw.rounded_rectangle([555, 385, WIDTH - 65, 440], radius=6, fill="#F8FAFC", outline="#E2E8F0")
    draw.text((570, 395), "Flight: Air France AF007", font=get_font(12, bold=True), fill="#0B2545")
    draw.text((570, 415), "Departs 19:30 • Arrives 08:55 • Non-Stop", font=get_font(11), fill="#64748B")
    
    # Hotel detail in bundle
    draw.rounded_rectangle([555, 450, WIDTH - 65, 505], radius=6, fill="#F8FAFC", outline="#E2E8F0")
    draw.text((570, 460), "Hotel: Ritz Paris (Superior Room)", font=get_font(12, bold=True), fill="#0B2545")
    draw.text((570, 480), "4.9 Rating • Place Vendome • Luxury Spa", font=get_font(11), fill="#64748B")
    
    # Price and CTA
    draw.text((555, 525), "Original: $780.00", font=get_font(12), fill="#94A3B8")
    draw.line([555, 532, 665, 532], fill="#EF4444", width=2)
    draw.text((555, 545), "$663.00", font=get_font(26, bold=True), fill="#EA580C")
    draw.text((675, 555), "Total Combo Price", font=get_font(11), fill="#64748B")
    
    draw.rounded_rectangle([WIDTH - 210, 535, WIDTH - 65, 575], radius=8, fill="#0F766E")
    draw.text((WIDTH - 185, 547), "Book Package >", font=get_font(13, bold=True), fill="#FFFFFF")
    
    return img

# --- SCENE 4: Unified Multi-Item Checkout & Redis Seat Hold ---
def render_scene_4():
    img = Image.new("RGB", (WIDTH, HEIGHT), "#020617")
    draw = ImageDraw.Draw(img)
    draw_window_chrome(draw, "https://travelgo.local/checkout")
    draw_app_navbar(draw, active_tab="flights")
    draw_stepper(draw, 4, 6, "Multi-Item Cart Hold in Redis (10-Minute Lock with Zero Overbooking)")
    
    # Hold Alert Banner
    draw.rounded_rectangle([45, 180, WIDTH - 45, 230], radius=8, fill="#FEF3C7", outline="#F59E0B", width=1)
    draw.text((65, 195), "HOLD ACTIVE: 09:44 remaining.", font=get_font(13, bold=True), fill="#B45309")
    draw.text((310, 196), "Your flight seat and hotel room are locked in Redis memory.", font=get_font(13), fill="#78350F")
    
    # Main Checkout Grid
    # Left: Passenger & Payment Details
    draw.rounded_rectangle([45, 245, 630, 595], radius=12, fill="#FFFFFF", outline="#E2E8F0", width=1)
    draw.text((65, 265), "Passenger & Billing Information", font=get_font(16, bold=True), fill="#0F172A")
    
    # Inputs
    fields = [
        ("Full Name", "Alex Mercer", 65, 300, 325, 345),
        ("Email Address", "alex.mercer@example.com", 350, 300, 610, 345),
        ("Passport Number", "P892014772", 65, 370, 325, 415),
        ("Nationality", "United States (US)", 350, 370, 610, 415),
    ]
    for lbl, val, x1, y1, x2, y2 in fields:
        draw.text((x1, y1 - 18), lbl, font=get_font(11, bold=True), fill="#475569")
        draw.rounded_rectangle([x1, y1, x2, y2], radius=6, fill="#F8FAFC", outline="#CBD5E1")
        draw.text((x1 + 12, y1 + 12), val, font=get_font(13), fill="#0F172A")
        
    draw.text((65, 440), "Payment Method (Mock Payment Gateway)", font=get_font(14, bold=True), fill="#0F172A")
    draw.rounded_rectangle([65, 465, 610, 515], radius=8, fill="#F0FDF4", outline="#86EFAC")
    draw.text((80, 480), "CARD: Visa ending in 4242 • Auto-compensating Saga enabled", font=get_font(12, bold=True), fill="#166534")
    
    draw.rounded_rectangle([65, 535, 610, 580], radius=8, fill="#0F766E")
    draw.text((200, 549), "Authorize & Start Saga Checkout ($697.00) >", font=get_font(14, bold=True), fill="#FFFFFF")
    
    # Right: Order Summary Card
    draw.rounded_rectangle([650, 245, WIDTH - 45, 595], radius=12, fill="#FFFFFF", outline="#E2E8F0", width=1)
    draw.text((670, 265), "Package Order Summary", font=get_font(16, bold=True), fill="#0F172A")
    
    # Items
    draw.text((670, 305), "1x Flight BA178 (JFK -> LHR)", font=get_font(12, bold=True), fill="#0F172A")
    draw.text((670, 325), "American / British Airways Direct", font=get_font(11), fill="#64748B")
    draw.text((WIDTH - 120, 305), "$620.00", font=get_font(12, bold=True), fill="#0F172A")
    
    draw.line([670, 350, WIDTH - 65, 350], fill="#E2E8F0")
    
    draw.text((670, 365), "1x Hotel: The Savoy London", font=get_font(12, bold=True), fill="#0F172A")
    draw.text((670, 385), "Deluxe King (1 Night)", font=get_font(11), fill="#64748B")
    draw.text((WIDTH - 120, 365), "$200.00", font=get_font(12, bold=True), fill="#0F172A")
    
    draw.line([670, 410, WIDTH - 65, 410], fill="#E2E8F0")
    
    draw.text((670, 425), "Subtotal", font=get_font(13), fill="#64748B")
    draw.text((WIDTH - 120, 425), "$820.00", font=get_font(13), fill="#64748B")
    
    draw.text((670, 450), "Combo Discount (15%)", font=get_font(13, bold=True), fill="#EA580C")
    draw.text((WIDTH - 130, 450), "-$123.00", font=get_font(13, bold=True), fill="#EA580C")
    
    draw.text((670, 475), "Taxes & Airport Surcharges", font=get_font(13), fill="#64748B")
    draw.text((WIDTH - 120, 475), "$0.00", font=get_font(13), fill="#64748B")
    
    draw.line([670, 505, WIDTH - 65, 505], fill="#CBD5E1", width=2)
    
    draw.text((670, 525), "Total Amount", font=get_font(16, bold=True), fill="#0F172A")
    draw.text((WIDTH - 150, 523), "$697.00", font=get_font(22, bold=True), fill="#0F766E")
    
    draw.text((670, 560), "+ Earns +70 Loyalty Points upon completion", font=get_font(11, bold=True), fill="#F59E0B")
    
    return img

# --- SCENE 5: Real-Time SSE Processing & Saga Choreography ---
def render_scene_5():
    img = Image.new("RGB", (WIDTH, HEIGHT), "#020617")
    draw = ImageDraw.Draw(img)
    draw_window_chrome(draw, "https://travelgo.local/bookings/b-90214-live")
    draw_app_navbar(draw, active_tab="bookings")
    draw_stepper(draw, 5, 6, "Real-Time Event-Driven Saga Choreography with SSE Status Push")
    
    # Live status card
    draw.rounded_rectangle([45, 185, WIDTH - 45, 275], radius=12, fill="#0B2545")
    draw.ellipse([65, 210, 85, 230], fill="#10B981")
    draw.text((100, 205), "Booking Saga Confirmed • Live SSE Stream Active", font=get_font(18, bold=True), fill="#FFFFFF")
    draw.text((100, 235), "Booking Reference: TG-89104-LDN • Zero polling required (Server-Sent Events push)", font=get_font(13), fill="#94A3B8")
    
    # Event Choreography Timeline
    draw.rounded_rectangle([45, 295, WIDTH - 45, 600], radius=12, fill="#FFFFFF", outline="#E2E8F0", width=1)
    draw.text((65, 315), "Distributed Microservice Choreography Log (RabbitMQ + Transactional Outbox)", font=get_font(15, bold=True), fill="#0F172A")
    
    saga_events = [
        ("booking-service", "booking.created", "Transactional outbox created booking with PENDING status", "0.00s", "#0F766E"),
        ("payment-service", "payment.succeeded", "Captured payment of $697.00 via mock payment gateway", "+0.32s", "#10B981"),
        ("catalog-service", "inventory.reserved", "Seat BA178-1017 and Savoy Room permanently confirmed", "+0.45s", "#10B981"),
        ("booking-service", "booking.confirmed", "Saga state machine validated transition to CONFIRMED", "+0.58s", "#10B981"),
        ("notification-service", "ticket.issued", "E-Ticket PDF with QR code generated and dispatched to Mailpit", "+0.72s", "#3B82F6"),
        ("engagement-service", "loyalty.credited", "+70 points credited to member ledger (Silver Tier Progress)", "+0.85s", "#F59E0B"),
    ]
    
    ey = 355
    for service, event_name, desc, time_str, dot_color in saga_events:
        # Dot
        draw.ellipse([65, ey + 4, 77, ey + 16], fill=dot_color)
        if ey < 530:
            draw.line([71, ey + 16, 71, ey + 38], fill="#CBD5E1", width=2)
            
        draw.rounded_rectangle([95, ey, 240, ey + 22], radius=4, fill="#F1F5F9")
        draw.text((102, ey + 4), service, font=get_font(10, bold=True), fill="#334155")
        
        draw.text((255, ey + 3), event_name, font=get_font(12, bold=True, mono=True), fill="#0F172A")
        draw.text((455, ey + 4), desc, font=get_font(11), fill="#64748B")
        draw.text((WIDTH - 120, ey + 4), time_str, font=get_font(11, bold=True, mono=True), fill="#0F766E")
        
        ey += 38
        
    return img

# --- SCENE 6: Digital Boarding Pass & QR E-Ticket ---
def render_scene_6():
    img = Image.new("RGB", (WIDTH, HEIGHT), "#020617")
    draw = ImageDraw.Draw(img)
    draw_window_chrome(draw, "https://travelgo.local/bookings/b-90214-ticket")
    draw_app_navbar(draw, active_tab="bookings")
    draw_stepper(draw, 6, 6, "Digital Boarding Pass, Downloadable PDF E-Ticket & Loyalty Rewards")
    
    # Success Banner
    draw.rounded_rectangle([45, 180, WIDTH - 45, 235], radius=8, fill="#ECFDF5", outline="#6EE7B7", width=1)
    draw.text((65, 195), "SAGA BOOKING COMPLETED SUCCESSFULLY [CONFIRMED]", font=get_font(14, bold=True), fill="#065F46")
    draw.text((65, 215), "Confirmation email dispatched to Mailpit (:8025) • PDF ticket generated with verifiable QR", font=get_font(12), fill="#047857")
    
    # Boarding Pass Main Card
    draw.rounded_rectangle([45, 250, 720, 590], radius=14, fill="#FFFFFF", outline="#0F766E", width=2)
    # Header of Ticket
    draw.rounded_rectangle([45, 250, 720, 310], radius=14, fill="#0B2545")
    draw.rectangle([45, 290, 720, 310], fill="#0B2545")
    draw.text((65, 265), "TRAVELGO BOARDING PASS", font=get_font(14, bold=True), fill="#FFFFFF")
    draw.text((65, 285), "British Airways • Flight BA178", font=get_font(11), fill="#94A3B8")
    draw.text((580, 275), "SEAT 14A", font=get_font(18, bold=True), fill="#F5B83D")
    
    # Passenger & Flight Details
    draw.text((65, 330), "PASSENGER", font=get_font(10, bold=True), fill="#64748B")
    draw.text((65, 348), "ALEX MERCER", font=get_font(16, bold=True), fill="#0F172A")
    
    draw.text((280, 330), "DATE", font=get_font(10, bold=True), fill="#64748B")
    draw.text((280, 348), "OCT 17, 2026", font=get_font(16, bold=True), fill="#0F172A")
    
    draw.text((480, 330), "GATE", font=get_font(10, bold=True), fill="#64748B")
    draw.text((480, 348), "B22", font=get_font(16, bold=True), fill="#0F766E")
    
    # Route row
    draw.rounded_rectangle([65, 385, 700, 475], radius=8, fill="#F8FAFC", outline="#E2E8F0")
    draw.text((85, 400), "JFK", font=get_font(28, bold=True), fill="#0B2545")
    draw.text((85, 438), "New York • 21:00", font=get_font(12), fill="#64748B")
    
    draw.text((260, 415), "------ 7h 00m ------>", font=get_font(12, bold=True), fill="#0F766E")
    draw.text((315, 435), "Non-Stop", font=get_font(10), fill="#94A3B8")
    
    draw.text((560, 400), "LHR", font=get_font(28, bold=True), fill="#0B2545")
    draw.text((560, 438), "London • 09:00+1", font=get_font(12), fill="#64748B")
    
    # Barcode representation
    draw.text((65, 500), "BOARDING BARCODE / E-TICKET VERIFICATION", font=get_font(10, bold=True), fill="#64748B")
    bx = 65
    for bar_w in [2, 4, 1, 5, 3, 2, 6, 2, 4, 3, 5, 2, 1, 4, 6, 2, 3, 5, 2, 4, 1, 3, 6, 2, 4, 2, 5, 3, 1, 4, 6, 2, 4, 1, 5, 3, 2, 6]:
        draw.rectangle([bx, 520, bx + bar_w, 570], fill="#0F172A")
        bx += bar_w + 3
        
    draw.text((bx + 20, 535), "TG-BA178-89104", font=get_font(12, bold=True, mono=True), fill="#0F766E")
    
    # Right Column: Download & Loyalty Widget
    draw.rounded_rectangle([740, 250, WIDTH - 45, 420], radius=12, fill="#FFFFFF", outline="#E2E8F0", width=1)
    draw.text((760, 270), "Download Documents", font=get_font(14, bold=True), fill="#0F172A")
    
    draw.rounded_rectangle([760, 300, WIDTH - 65, 345], radius=6, fill="#0F766E")
    draw.text((785, 313), "Download PDF E-Ticket", font=get_font(12, bold=True), fill="#FFFFFF")
    
    draw.rounded_rectangle([760, 360, WIDTH - 65, 405], radius=6, fill="#F1F5F9", outline="#CBD5E1")
    draw.text((785, 373), "View in Mailpit (:8025)", font=get_font(12, bold=True), fill="#334155")
    
    # Loyalty Card
    draw.rounded_rectangle([740, 440, WIDTH - 45, 590], radius=12, fill="#FEF3C7", outline="#F59E0B", width=1)
    draw.text((760, 458), "TravelGo Loyalty Rewards", font=get_font(14, bold=True), fill="#92400E")
    draw.text((760, 485), "+70 Points Credited!", font=get_font(16, bold=True), fill="#B45309")
    draw.text((760, 515), "New Lifetime Balance: 2,520 pts", font=get_font(12), fill="#78350F")
    
    # Tier Progress Bar
    draw.rounded_rectangle([760, 540, WIDTH - 65, 552], radius=6, fill="#FDE68A")
    draw.rounded_rectangle([760, 540, WIDTH - 120, 552], radius=6, fill="#D97706")
    draw.text((760, 560), "Current Tier: GOLD (100% Top Tier)", font=get_font(10, bold=True), fill="#92400E")
    
    return img

def main():
    temp_dir = "/tmp/travelgo_gif_frames"
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)
    os.makedirs(temp_dir, exist_ok=True)
    
    scenes = [
        (render_scene_1(), "Scene 1: Route Search"),
        (render_scene_2(), "Scene 2: 7-Day Fare Calendar"),
        (render_scene_3(), "Scene 3: Package Deals"),
        (render_scene_4(), "Scene 4: Unified Checkout & Redis Hold"),
        (render_scene_5(), "Scene 5: Saga Choreography & SSE"),
        (render_scene_6(), "Scene 6: Boarding Pass & E-Ticket"),
    ]
    
    # Generate frame sequences (each scene held for ~2.5 seconds = 5 frames at 2 fps)
    frame_idx = 0
    for img, desc in scenes:
        print(f"Generating frames for {desc}...")
        for _ in range(5):
            img.save(os.path.join(temp_dir, f"frame_{frame_idx:04d}.png"))
            frame_idx += 1
            
    output_gif = "docs/assets/travel-booking-workflow.gif"
    os.makedirs(os.path.dirname(output_gif), exist_ok=True)
    
    print("Compiling GIF with ffmpeg...")
    cmd = [
        "ffmpeg", "-y",
        "-framerate", "2",
        "-i", os.path.join(temp_dir, "frame_%04d.png"),
        "-vf", "split[s0][s1];[s0]palettegen=max_colors=128:reserve_transparent=0[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3",
        "-loop", "0",
        output_gif
    ]
    subprocess.run(cmd, check=True)
    
    size_mb = os.path.getsize(output_gif) / (1024 * 1024)
    print(f"Successfully generated {output_gif} ({size_mb:.2f} MB)")
    shutil.rmtree(temp_dir)

if __name__ == "__main__":
    main()
