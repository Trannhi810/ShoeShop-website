require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../schemas/userSchema');

// ===== Thông tin admin mặc định =====
const ADMIN_EMAIL    = 'admin@shoeshop.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_NAME     = 'Super Admin';
// =====================================

async function seedAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Kết nối MongoDB thành công:', process.env.MONGODB_URI);

        const existing = await User.findOne({ email: ADMIN_EMAIL });

        if (existing) {
            console.log(`ℹ️  Tài khoản admin đã tồn tại:`);
            console.log(`   Email : ${existing.email}`);
            console.log(`   Họ tên: ${existing.fullName || '(chưa có)'}`);
            console.log(`   Role  : ${existing.role}`);
            console.log(`   Active: ${existing.isActive}`);

            let changed = false;

            // Nâng cấp role nếu chưa là ADMIN
            if (existing.role !== 'ADMIN') {
                existing.role = 'ADMIN';
                changed = true;
                console.log('⬆️  Đã nâng cấp role lên ADMIN!');
            }

            // Gán fullName nếu chưa có
            if (!existing.fullName) {
                existing.fullName = ADMIN_NAME;
                changed = true;
                console.log(`✏️  Đã cập nhật họ tên: ${ADMIN_NAME}`);
            }

            if (changed) await existing.save();

        } else {
            const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
            const admin = await User.create({
                email:    ADMIN_EMAIL,
                password: hashed,
                fullName: ADMIN_NAME,
                role:     'ADMIN',
                isActive: true,
            });
            console.log('🎉 Tạo tài khoản admin thành công!');
            console.log('─'.repeat(40));
            console.log(`   Email   : ${admin.email}`);
            console.log(`   Mật khẩu: ${ADMIN_PASSWORD}`);
            console.log(`   Họ tên  : ${admin.fullName}`);
            console.log(`   Role    : ${admin.role}`);
            console.log('─'.repeat(40));
        }
    } catch (err) {
        console.error('❌ Lỗi:', err.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Đã ngắt kết nối MongoDB.');
    }
}

seedAdmin();
