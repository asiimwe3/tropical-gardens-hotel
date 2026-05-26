insert into rooms (name, room_number, description, type, price, capacity, image_url, is_available) values
('Garden Standard Room', '101', 'Calm garden-facing room with queen bed and en-suite bathroom.', 'Standard', 80000, 2, 'https://tropicalgardenshotel.com/wp-content/uploads/2023/06/2-min.jpg', true),
('Deluxe Nature Room', '201', 'Spacious deluxe room with king bed, work desk, and peaceful garden views.', 'Deluxe', 150000, 2, 'https://tropicalgardenshotel.com/wp-content/uploads/2023/06/8-min.jpg', true),
('Executive Family Suite', '301', 'Premium suite with lounge space, family comfort, and elevated privacy.', 'Suite', 250000, 4, 'https://tropicalgardenshotel.com/wp-content/uploads/2023/06/3-min.jpg', true)
on conflict do nothing;

insert into menu_items (name, description, category, price, is_available, is_featured) values
('Tropical Breakfast Platter', 'Fresh fruit, eggs, toast, juice, and Ugandan tea.', 'Breakfast', 18000, true, true),
('Grilled Tilapia', 'Fresh tilapia grilled with herbs and served with local sides.', 'Lunch', 32000, true, true),
('Garden Chicken Dinner', 'Tender chicken stew with matooke, rice, or posho.', 'Dinner', 28000, true, false),
('Fresh Passion Juice', 'Cold house-made passion fruit juice.', 'Drinks', 7000, true, false)
on conflict do nothing;

insert into offers (title, description, discount_percent, code, starts_at, ends_at, is_active) values
('Weekend Garden Escape', 'Save on Friday to Sunday stays for couples and families.', 20, 'GARDEN20', current_date, current_date + interval '60 days', true)
on conflict do nothing;

insert into notifications (title, body, channel, audience, type, is_active) values
('Weekend Special Offer', 'Book this weekend and enjoy 20% off all rooms. Use code GARDEN20.', 'Website Banner', 'All Guests', 'promo', true),
('New Breakfast Menu', 'We have added new breakfast options for guests and visitors.', 'Website', 'All Guests', 'update', true)
on conflict do nothing;
