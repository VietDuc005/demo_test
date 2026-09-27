-- ==============================================================================
-- DATABASE SEED DATA: SHOWROOM A (HONDA) & SHOWROOM B (TOYOTA)
-- Realistic Vietnamese Automotive Dealership Operations
-- ==============================================================================

-- 1. Business Accounts
INSERT INTO business_accounts (id, name, brand, address, hotline, working_hours, kb_version)
VALUES 
('SHOWROOM_A', 'Showroom Ô Tô Honda Giải Phóng', 'Honda', 'Số 883 Đường Giải Phóng, Giáp Bát, Hoàng Mai, Hà Nội', '024.3861.6888', '08:00 - 18:00', 'v2.1'),
('SHOWROOM_B', 'Showroom Toyota Bến Thành', 'Toyota', 'Số 326 Võ Văn Kiệt, Phường Cô Giang, Quận 1, TP. Hồ Chí Minh', '028.3837.7799', '08:00 - 18:00', 'v3.0')
ON CONFLICT (id) DO NOTHING;

-- 2. Users (Staff & Customers)
INSERT INTO users (id, business_id, username, password_hash, full_name, email, phone, role, is_online)
VALUES
-- Showroom A Staff
('a1000000-0000-0000-0000-000000000001', 'SHOWROOM_A', 'sale_lan_a', '$2b$12$e/samplehashonlyfakesaltforsecurity01', 'Trần Thị Lan', 'lan.tran@hondagiaiphong.vn', '0988111222', 'SALES_CONSULTANT', TRUE),
('a1000000-0000-0000-0000-000000000002', 'SHOWROOM_A', 'sale_hung_a', '$2b$12$e/samplehashonlyfakesaltforsecurity02', 'Phạm Quốc Hưng', 'hung.pham@hondagiaiphong.vn', '0988222333', 'SALES_CONSULTANT', FALSE),
('a1000000-0000-0000-0000-000000000003', 'SHOWROOM_A', 'mgr_hai_a', '$2b$12$e/samplehashonlyfakesaltforsecurity03', 'Trần Đình Hải', 'hai.tran@hondagiaiphong.vn', '0988333444', 'SALES_MANAGER', TRUE),

-- Showroom B Staff
('b1000000-0000-0000-0000-000000000001', 'SHOWROOM_B', 'sale_lam_b', '$2b$12$e/samplehashonlyfakesaltforsecurity04', 'Đặng Văn Lâm', 'lam.dang@toyotabenthanh.vn', '0977111222', 'SALES_CONSULTANT', TRUE),
('b1000000-0000-0000-0000-000000000002', 'SHOWROOM_B', 'mgr_nam_b', '$2b$12$e/samplehashonlyfakesaltforsecurity05', 'Ngô Hoàng Nam', 'nam.ngo@toyotabenthanh.vn', '0977222333', 'SALES_MANAGER', TRUE),

-- Customers
('c1000000-0000-0000-0000-000000000001', 'SHOWROOM_A', 'khach_tuan', '$2b$12$e/samplehashonlyfakesaltforsecurity06', 'Nguyễn Văn Tuấn', 'tuan.nguyen@email.vn', '0912345678', 'CUSTOMER', TRUE),
('c1000000-0000-0000-0000-000000000002', 'SHOWROOM_A', 'khach_maianh', '$2b$12$e/samplehashonlyfakesaltforsecurity07', 'Lê Thị Mai Anh', 'maianh.le@gmail.com', '0987654321', 'CUSTOMER', FALSE),
('c1000000-0000-0000-0000-000000000003', 'SHOWROOM_B', 'khach_duc', '$2b$12$e/samplehashonlyfakesaltforsecurity08', 'Hoàng Minh Đức', 'duc.hoang@company.vn', '0903112233', 'CUSTOMER', FALSE),
('c1000000-0000-0000-0000-000000000004', 'SHOWROOM_B', 'khach_trang', '$2b$12$e/samplehashonlyfakesaltforsecurity09', 'Vũ Thu Trang', 'trang.vu@outlook.com', '0945678901', 'CUSTOMER', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3. Vehicles
INSERT INTO vehicles (id, business_id, model_name, trim_level, category, model_year, listed_price, deposit_required, available_stock, specifications, rolling_price_estimates)
VALUES
('VEH-CRV-2026', 'SHOWROOM_A', 'Honda CR-V L', 'L AWD (Dẫn động 4 bánh)', 'C-SUV', 2026, 1110000000, 20000000, 5, 
 '{"engine": "1.5L VTEC TURBO", "power_hp": 188, "torque_nm": 240, "transmission": "CVT", "seats": 7}'::jsonb,
 '{"hanoi": 1265000000, "hcm": 1243000000, "provinces": 1224000000}'::jsonb),

('VEH-CITY-2026', 'SHOWROOM_A', 'Honda City', 'RS (Thể thao)', 'B-Sedan', 2026, 609000000, 10000000, 8,
 '{"engine": "1.5L DOHC i-VTEC", "power_hp": 119, "torque_nm": 145, "transmission": "CVT", "seats": 5}'::jsonb,
 '{"hanoi": 704000000, "hcm": 692000000, "provinces": 673000000}'::jsonb),

('VEH-CAMRY-2026', 'SHOWROOM_B', 'Toyota Camry', '2.5 HEV (Hybrid)', 'D-Sedan', 2026, 1460000000, 30000000, 3,
 '{"engine": "2.5L Xăng + Hybrid Thế hệ 5", "power_hp": 211, "torque_nm": 221, "transmission": "E-CVT", "seats": 5}'::jsonb,
 '{"hanoi": 1657000000, "hcm": 1628000000, "provinces": 1609000000}'::jsonb),

('VEH-COROLLA-CROSS-2026', 'SHOWROOM_B', 'Toyota Corolla Cross', '1.8 HEV (Hybrid)', 'B+ SUV', 2026, 905000000, 20000000, 6,
 '{"engine": "1.8L Xăng + Hybrid", "power_hp": 138, "torque_nm": 172, "transmission": "E-CVT", "seats": 5}'::jsonb,
 '{"hanoi": 1035000000, "hcm": 1017000000, "provinces": 998000000}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 4. Test Drive Bookings
INSERT INTO test_drive_bookings (id, business_id, customer_id, vehicle_id, service_type, location, slot_start, slot_end, status, assigned_consultant_id, special_notes, idempotency_request_id)
VALUES
('BK-202609-001', 'SHOWROOM_A', 'c1000000-0000-0000-0000-000000000001', 'VEH-CRV-2026', 'TEST_DRIVE', 'Showroom Honda Giải Phóng, Hà Nội', '2026-09-26 09:00:00+07', '2026-09-26 10:00:00+07', 'CONFIRMED', 'a1000000-0000-0000-0000-000000000001', 'Trải nghiệm tính năng Honda SENSING trên đường phố', 'REQ-IDEMP-001-A'),
('BK-202609-002', 'SHOWROOM_B', 'c1000000-0000-0000-0000-000000000003', 'VEH-CAMRY-2026', 'IN_PERSON_CONSULTATION', 'Showroom Toyota Bến Thành, TP. Hồ Chí Minh', '2026-09-24 14:30:00+07', '2026-09-24 15:30:00+07', 'CONFIRMED', 'b1000000-0000-0000-0000-000000000001', 'Tư vấn phương án mua xe doanh nghiệp khấu trừ thuế GTGT', 'REQ-IDEMP-002-B')
ON CONFLICT (id) DO NOTHING;
