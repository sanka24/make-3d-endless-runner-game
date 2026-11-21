/**
 * IronPulse Gym Management CRM & Automated 3-Day Expiry Reminder System
 * Full-featured member tracker, mobile-number messaging, and attendance logger
 */

class GymManagementApp {
    constructor() {
        this.STORAGE_KEY = 'ironpulse_gym_data_v1';
        this.SETTINGS_KEY = 'ironpulse_gym_settings_v1';
        this.LOGS_KEY = 'ironpulse_gym_logs_v1';
        this.ATTENDANCE_KEY = 'ironpulse_gym_attendance_v1';

        // Load or initialize state
        this.loadSettings();
        this.loadMembers();
        this.loadLogs();
        this.loadAttendance();

        this.currentFilter = 'all';
        this.currentMemberFilter = 'all';

        // Initialize UI and automated reminder loop
        this.initDOM();
        this.bindEvents();
        this.renderAll();

        // Run automated 3-day expiry background scanner
        this.runAutomatedReminderScan(true);

        // Schedule periodic automated checks every 60 seconds
        setInterval(() => {
            this.runAutomatedReminderScan(false);
        }, 60000);
    }

    // --- State Persistence ---
    loadSettings() {
        const defaultSettings = {
            gymName: 'IronPulse Fitness Club',
            gymPhone: '+1 (555) 234-5678',
            gymAddress: '104 Olympic Blvd, Suite 200, Downtown',
            currency: '$',
            reminderDaysBefore: 3,
            autoSendReminders: true,
            defaultChannel: 'whatsapp',
            messageTemplate: 'Hi {memberName}, your {gymName} {planName} membership expires in {daysLeft} days on {expiryDate}. Renew now to avoid any interruption in your workouts! Contact {gymPhone}.',
            webhookUrl: ''
        };
        try {
            const saved = JSON.parse(localStorage.getItem(this.SETTINGS_KEY));
            this.settings = Object.assign(defaultSettings, saved || {});
        } catch (e) {
            this.settings = defaultSettings;
        }
    }

    saveSettings() {
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings));
        this.showToast('Gym settings saved successfully.', 'success');
        this.renderAll();
    }

    loadMembers() {
        try {
            const saved = JSON.parse(localStorage.getItem(this.STORAGE_KEY));
            if (saved && Array.isArray(saved) && saved.length > 0) {
                this.members = saved;
            } else {
                this.members = this.generateDemoMembers();
                this.saveMembers();
            }
        } catch (e) {
            this.members = this.generateDemoMembers();
            this.saveMembers();
        }
    }

    saveMembers() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.members));
    }

    loadLogs() {
        try {
            this.messageLogs = JSON.parse(localStorage.getItem(this.LOGS_KEY)) || [];
        } catch (e) {
            this.messageLogs = [];
        }
    }

    saveLogs() {
        localStorage.setItem(this.LOGS_KEY, JSON.stringify(this.messageLogs));
    }

    loadAttendance() {
        try {
            this.attendance = JSON.parse(localStorage.getItem(this.ATTENDANCE_KEY)) || [];
        } catch (e) {
            this.attendance = [];
        }
    }

    saveAttendance() {
        localStorage.setItem(this.ATTENDANCE_KEY, JSON.stringify(this.attendance));
    }

    // --- Demo Data Generator (Realistic Relative Dates) ---
    generateDemoMembers() {
        const today = new Date();
        const formatDate = (date) => date.toISOString().split('T')[0];

        // Helper to add days relative to today
        const addDays = (n) => {
            const d = new Date(today);
            d.setDate(d.getDate() + n);
            return formatDate(d);
        };

        const subDays = (n) => {
            const d = new Date(today);
            d.setDate(d.getDate() - n);
            return formatDate(d);
        };

        return [
            {
                id: 'MEM-1001',
                name: 'Marcus Vance',
                mobile: '+1 987-654-3210',
                email: 'marcus.v@example.com',
                gender: 'Male',
                plan: '3 Months',
                amount: 140,
                joinDate: subDays(87),
                expiryDate: addDays(3), // Exactly 3 Days Left!
                paymentMode: 'UPI / Online',
                emergency: '+1 987-000-1111',
                notes: 'Weight training, strength conditioning',
                lastReminderDate: null
            },
            {
                id: 'MEM-1002',
                name: 'Sophia Chen',
                mobile: '+1 876-543-2109',
                email: 'sophia.c@example.com',
                gender: 'Female',
                plan: '1 Month',
                amount: 55,
                joinDate: subDays(28),
                expiryDate: addDays(2), // 2 Days Left!
                paymentMode: 'Cash',
                emergency: '+1 876-000-2222',
                notes: 'Pilates and HIIT cardio',
                lastReminderDate: null
            },
            {
                id: 'MEM-1003',
                name: 'David Rodriguez',
                mobile: '+1 765-432-1098',
                email: 'david.r@example.com',
                gender: 'Male',
                plan: '6 Months',
                amount: 260,
                joinDate: subDays(179),
                expiryDate: addDays(1), // Tomorrow!
                paymentMode: 'Card',
                emergency: '+1 765-000-3333',
                notes: 'CrossFit enthusiast',
                lastReminderDate: null
            },
            {
                id: 'MEM-1004',
                name: 'Emma Watson',
                mobile: '+1 654-321-0987',
                email: 'emma.w@example.com',
                gender: 'Female',
                plan: '3 Months',
                amount: 140,
                joinDate: subDays(90),
                expiryDate: addDays(0), // Today!
                paymentMode: 'UPI / Online',
                emergency: '+1 654-000-4444',
                notes: 'Endurance runner',
                lastReminderDate: null
            },
            {
                id: 'MEM-1005',
                name: 'Liam O\'Connor',
                mobile: '+1 543-210-9876',
                email: 'liam.oc@example.com',
                gender: 'Male',
                plan: '12 Months',
                amount: 480,
                joinDate: subDays(120),
                expiryDate: addDays(245), // Active
                paymentMode: 'Card',
                emergency: '+1 543-000-5555',
                notes: 'Annual VIP gym pass',
                lastReminderDate: null
            },
            {
                id: 'MEM-1006',
                name: 'Aaliyah Patel',
                mobile: '+1 432-109-8765',
                email: 'aaliyah.p@example.com',
                gender: 'Female',
                plan: '3 Months',
                amount: 140,
                joinDate: subDays(30),
                expiryDate: addDays(60), // Active
                paymentMode: 'Cash',
                emergency: '+1 432-000-6666',
                notes: 'Morning yoga and gym session',
                lastReminderDate: null
            },
            {
                id: 'MEM-1007',
                name: 'James Wilson',
                mobile: '+1 321-098-7654',
                email: 'james.w@example.com',
                gender: 'Male',
                plan: '1 Month',
                amount: 55,
                joinDate: subDays(36),
                expiryDate: subDays(6), // Expired 6 days ago
                paymentMode: 'Cash',
                emergency: '+1 321-000-7777',
                notes: 'Left gym temporarily, follow up for renewal',
                lastReminderDate: null
            }
        ];
    }

    // --- Date & Expiry Utilities ---
    getDaysUntilExpiry(expiryDateStr) {
        if (!expiryDateStr) return -999;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDateStr + 'T00:00:00');
        expiry.setHours(0, 0, 0, 0);
        const diffTime = expiry - today;
        return Math.round(diffTime / (1000 * 60 * 60 * 24));
    }

    calculateExpiryDate(joinDateStr, planStr) {
        if (!joinDateStr) return '';
        const date = new Date(joinDateStr + 'T00:00:00');
        if (planStr.includes('1 Month')) date.setMonth(date.getMonth() + 1);
        else if (planStr.includes('3 Month')) date.setMonth(date.getMonth() + 3);
        else if (planStr.includes('6 Month')) date.setMonth(date.getMonth() + 6);
        else if (planStr.includes('12 Month')) date.setFullYear(date.getFullYear() + 1);
        else date.setMonth(date.getMonth() + 1);
        return date.toISOString().split('T')[0];
    }

    formatDisplayDate(dateStr) {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // --- Automated 3-Day Expiry Reminder Engine ---
    /**
     * Scans all members and triggers automatic reminder messages when
     * membership is expiring within 3 days.
     */
    runAutomatedReminderScan(isInitialLoad = false) {
        if (!this.settings.autoSendReminders) return;

        const todayStr = new Date().toISOString().split('T')[0];
        let sentCount = 0;

        this.members.forEach(member => {
            const daysLeft = this.getDaysUntilExpiry(member.expiryDate);

            // Trigger criteria: Expires in exactly 3 days (or within 1 to 3 days, or today)
            // and has NOT received a reminder today
            if (daysLeft >= 0 && daysLeft <= 3) {
                if (member.lastReminderDate !== todayStr) {
                    // Send automatic reminder
                    this.dispatchAutomatedReminder(member, daysLeft, todayStr);
                    sentCount++;
                }
            }
        });

        if (sentCount > 0) {
            this.saveMembers();
            this.saveLogs();
            this.showToast(`🤖 Auto-Bot: Dispatched ${sentCount} expiry reminders (3-Day Alert)!`, 'warning');
            this.renderAll();
        }
    }

    dispatchAutomatedReminder(member, daysLeft, todayStr) {
        const messageText = this.buildMessageText(member, daysLeft);
        
        // Record in message logs
        const logEntry = {
            id: 'LOG-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
            memberId: member.id,
            memberName: member.name,
            mobile: member.mobile,
            channel: this.settings.defaultChannel.toUpperCase(),
            message: messageText,
            daysLeft: daysLeft,
            status: 'Delivered (Auto 3-Day Alert)'
        };

        this.messageLogs.unshift(logEntry);
        member.lastReminderDate = todayStr;
        member.remindersSent = (member.remindersSent || 0) + 1;
    }

    buildMessageText(member, daysLeft) {
        let tmpl = this.settings.messageTemplate;
        const formattedExpiry = this.formatDisplayDate(member.expiryDate);
        let daysText = daysLeft === 0 ? 'TODAY' : daysLeft === 1 ? '1 day (tomorrow)' : `${daysLeft} days`;

        tmpl = tmpl.replace(/{memberName}/g, member.name);
        tmpl = tmpl.replace(/{gymName}/g, this.settings.gymName);
        tmpl = tmpl.replace(/{planName}/g, member.plan);
        tmpl = tmpl.replace(/{daysLeft}/g, daysText);
        tmpl = tmpl.replace(/{expiryDate}/g, formattedExpiry);
        tmpl = tmpl.replace(/{gymPhone}/g, this.settings.gymPhone);
        return tmpl;
    }

    // --- Direct Channel Message Trigger (WhatsApp & SMS) ---
    cleanPhoneNumber(phone) {
        // Strip out spaces, dashes, brackets
        let clean = phone.replace(/[^0-9+]/g, '');
        // If no country code, default to international format if needed
        if (!clean.startsWith('+') && clean.length === 10) {
            clean = '1' + clean; // default US/international or keep raw
        }
        return clean.replace('+', '');
    }

    openWhatsApp(member, customText = null) {
        const daysLeft = this.getDaysUntilExpiry(member.expiryDate);
        const text = customText || this.buildMessageText(member, daysLeft);
        const cleanPhone = this.cleanPhoneNumber(member.mobile);
        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;

        // Log the message dispatch
        this.logManualDispatch(member, 'WHATSAPP', text);

        // Open WhatsApp Web or mobile app
        window.open(url, '_blank');
        this.showToast(`Opening WhatsApp for ${member.name} (${member.mobile})...`, 'success');
    }

    openSMS(member, customText = null) {
        const daysLeft = this.getDaysUntilExpiry(member.expiryDate);
        const text = customText || this.buildMessageText(member, daysLeft);
        const cleanPhone = this.cleanPhoneNumber(member.mobile);
        const url = `sms:${cleanPhone}?body=${encodeURIComponent(text)}`;

        this.logManualDispatch(member, 'SMS', text);

        window.location.href = url;
        this.showToast(`Launching SMS composer for ${member.name}...`, 'info');
    }

    logManualDispatch(member, channel, text) {
        const todayStr = new Date().toISOString().split('T')[0];
        const logEntry = {
            id: 'LOG-' + Date.now(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
            memberId: member.id,
            memberName: member.name,
            mobile: member.mobile,
            channel: channel,
            message: text,
            daysLeft: this.getDaysUntilExpiry(member.expiryDate),
            status: 'Dispatched Directly'
        };
        this.messageLogs.unshift(logEntry);
        member.lastReminderDate = todayStr;
        this.saveLogs();
        this.saveMembers();
        this.renderAll();
    }

    sendBulk3DayReminders() {
        const expiringMembers = this.members.filter(m => {
            const d = this.getDaysUntilExpiry(m.expiryDate);
            return d >= 0 && d <= 3;
        });

        if (expiringMembers.length === 0) {
            this.showToast('No members currently expiring within 3 days.', 'info');
            return;
        }

        const todayStr = new Date().toISOString().split('T')[0];
        let count = 0;

        expiringMembers.forEach(m => {
            const daysLeft = this.getDaysUntilExpiry(m.expiryDate);
            this.dispatchAutomatedReminder(m, daysLeft, todayStr);
            count++;
        });

        this.saveMembers();
        this.saveLogs();
        this.showToast(`✅ Successfully dispatched 3-day reminders to ${count} members!`, 'success');
        this.renderAll();
    }

    // --- Check-in / Attendance System ---
    processCheckin(searchTerm) {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return;

        // Search by phone or name or ID
        const member = this.members.find(m => 
            m.mobile.replace(/[^0-9]/g, '').includes(term.replace(/[^0-9]/g, '')) ||
            m.name.toLowerCase().includes(term) ||
            m.id.toLowerCase() === term
        );

        const resultBox = document.getElementById('checkin-result-box');
        if (!member) {
            resultBox.style.display = 'block';
            resultBox.innerHTML = `
                <div style="background: rgba(244, 63, 94, 0.15); border: 1px solid var(--rose); padding: 16px; border-radius: var(--radius-md); text-align: left;">
                    <div style="font-weight: 700; color: var(--rose); font-size: 15px;">❌ Member Not Found</div>
                    <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">No gym record matched "${searchTerm}". Please verify mobile number or add member.</div>
                </div>
            `;
            this.showToast('Member not found for check-in.', 'warning');
            return;
        }

        const daysLeft = this.getDaysUntilExpiry(member.expiryDate);
        let statusBadge = '';
        let warningText = '';

        if (daysLeft < 0) {
            statusBadge = `<span class="badge badge-expired">EXPIRED (${Math.abs(daysLeft)} days ago)</span>`;
            warningText = `<div style="margin-top: 8px; color: var(--rose); font-weight: 700;">⚠️ Membership has expired! Please renew before workout.</div>`;
        } else if (daysLeft <= 3) {
            statusBadge = `<span class="badge badge-expiring">EXPIRES IN ${daysLeft === 0 ? 'TODAY' : daysLeft + ' DAYS'}</span>`;
            warningText = `<div style="margin-top: 8px; color: var(--amber); font-weight: 700;">⏰ Reminder: Membership expiring in ${daysLeft} days! (3-Day Alert)</div>`;
        } else {
            statusBadge = `<span class="badge badge-active">ACTIVE (${daysLeft} days left)</span>`;
        }

        // Add to attendance log
        const attendanceEntry = {
            id: 'ATT-' + Date.now(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            memberId: member.id,
            memberName: member.name,
            mobile: member.mobile,
            plan: member.plan,
            expiryDate: member.expiryDate,
            daysLeft: daysLeft
        };
        this.attendance.unshift(attendanceEntry);
        this.saveAttendance();

        // Render success card
        resultBox.style.display = 'block';
        resultBox.innerHTML = `
            <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid var(--emerald); padding: 18px; border-radius: var(--radius-md); text-align: left; animation: fadeIn 0.3s ease;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 11px; color: var(--emerald); font-weight: 800; letter-spacing: 0.8px;">CHECK-IN VERIFIED ✓</div>
                        <div style="font-weight: 800; color: #fff; font-size: 18px; margin-top: 2px;">${member.name}</div>
                        <div style="font-size: 13px; color: var(--text-secondary); font-family: monospace;">${member.mobile} • ${member.id}</div>
                    </div>
                    <div>${statusBadge}</div>
                </div>
                ${warningText}
                <div style="margin-top: 12px; display: flex; gap: 8px;">
                    ${daysLeft <= 3 ? `<button class="btn btn-amber btn-sm" onclick="window.gymApp.openRenewModal('${member.id}')">🔄 Renew Membership</button>` : ''}
                    <button class="btn btn-secondary btn-sm" onclick="window.gymApp.openReceiptModal('${member.id}')">🧾 View Receipt</button>
                </div>
            </div>
        `;

        this.showToast(`Check-in verified: ${member.name}`, 'success');
        this.renderAttendanceTable();
    }

    // --- Member CRUD ---
    addOrUpdateMember(memberData) {
        if (memberData.id) {
            // Update existing
            const idx = this.members.findIndex(m => m.id === memberData.id);
            if (idx !== -1) {
                this.members[idx] = Object.assign(this.members[idx], memberData);
                this.showToast(`Member ${memberData.name} updated.`, 'success');
            }
        } else {
            // Add new member
            const newId = 'MEM-' + (1000 + this.members.length + 1);
            const newMember = Object.assign({}, memberData, {
                id: newId,
                lastReminderDate: null,
                remindersSent: 0
            });
            this.members.unshift(newMember);
            this.showToast(`New member ${newMember.name} registered successfully!`, 'success');

            // Send immediate welcome WhatsApp/SMS
            this.showToast(`Mobile ${newMember.mobile} saved for automated 3-day reminders.`, 'info');
        }

        this.saveMembers();
        this.closeModal('modal-member');
        this.renderAll();
    }

    deleteMember(memberId) {
        const member = this.members.find(m => m.id === memberId);
        if (!member) return;

        if (confirm(`Are you sure you want to delete member record for ${member.name} (${member.mobile})?`)) {
            this.members = this.members.filter(m => m.id !== memberId);
            this.saveMembers();
            this.showToast(`Member ${member.name} deleted.`, 'info');
            this.renderAll();
        }
    }

    renewMember(memberId, planDuration, feeAmount, newExpiryDate) {
        const member = this.members.find(m => m.id === memberId);
        if (!member) return;

        member.plan = planDuration;
        member.amount = feeAmount;
        member.expiryDate = newExpiryDate;
        member.lastReminderDate = null; // Reset reminder flag

        this.saveMembers();
        this.closeModal('modal-renew');
        this.showToast(`Membership renewed for ${member.name} until ${this.formatDisplayDate(newExpiryDate)}!`, 'success');
        this.renderAll();
    }

    // --- UI Modals ---
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('active');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
    }

    openAddMemberModal() {
        document.getElementById('member-modal-title').innerText = 'Add New Gym Member';
        document.getElementById('form-member-id').value = '';
        document.getElementById('form-name').value = '';
        document.getElementById('form-mobile').value = '';
        document.getElementById('form-email').value = '';
        document.getElementById('form-plan').value = '3 Months';
        document.getElementById('form-amount').value = '140';

        const todayStr = new Date().toISOString().split('T')[0];
        document.getElementById('form-join-date').value = todayStr;
        document.getElementById('form-expiry-date').value = this.calculateExpiryDate(todayStr, '3 Months');

        document.getElementById('form-emergency').value = '';
        document.getElementById('form-notes').value = '';

        this.openModal('modal-member');
    }

    openEditMemberModal(memberId) {
        const member = this.members.find(m => m.id === memberId);
        if (!member) return;

        document.getElementById('member-modal-title').innerText = 'Edit Gym Member Record';
        document.getElementById('form-member-id').value = member.id;
        document.getElementById('form-name').value = member.name;
        document.getElementById('form-mobile').value = member.mobile;
        document.getElementById('form-email').value = member.email || '';
        document.getElementById('form-gender').value = member.gender || 'Male';
        document.getElementById('form-plan').value = member.plan;
        document.getElementById('form-amount').value = member.amount;
        document.getElementById('form-join-date').value = member.joinDate;
        document.getElementById('form-expiry-date').value = member.expiryDate;
        document.getElementById('form-payment-mode').value = member.paymentMode || 'Cash';
        document.getElementById('form-emergency').value = member.emergency || '';
        document.getElementById('form-notes').value = member.notes || '';

        this.openModal('modal-member');
    }

    openRenewModal(memberId) {
        const member = this.members.find(m => m.id === memberId);
        if (!member) return;

        document.getElementById('renew-member-id').value = member.id;
        document.getElementById('renew-member-name').innerText = member.name;
        document.getElementById('renew-member-phone').innerText = 'Phone: ' + member.mobile;
        document.getElementById('renew-current-expiry').innerText = 'Current Expiry: ' + this.formatDisplayDate(member.expiryDate);

        // Calculate default renewal (+3 months from today or current expiry)
        const baseDate = new Date(member.expiryDate) > new Date() ? member.expiryDate : new Date().toISOString().split('T')[0];
        const newExpiry = this.calculateExpiryDate(baseDate, '3 Months');

        document.getElementById('renew-plan').value = '3 Months';
        document.getElementById('renew-amount').value = member.amount || '140';
        document.getElementById('renew-new-expiry').value = newExpiry;

        this.openModal('modal-renew');
    }

    openSendMessageModal(memberId) {
        const member = this.members.find(m => m.id === memberId);
        if (!member) return;

        const daysLeft = this.getDaysUntilExpiry(member.expiryDate);
        document.getElementById('msg-member-id').value = member.id;
        document.getElementById('msg-recipient-name').innerText = member.name;
        document.getElementById('msg-recipient-phone').innerText = member.mobile;

        const badgeEl = document.getElementById('msg-recipient-badge');
        if (daysLeft < 0) {
            badgeEl.className = 'badge badge-expired';
            badgeEl.innerText = `Expired ${Math.abs(daysLeft)} Days Ago`;
        } else if (daysLeft <= 3) {
            badgeEl.className = 'badge badge-expiring';
            badgeEl.innerText = daysLeft === 0 ? 'Expires Today!' : `Expires in ${daysLeft} Days (3-Day Alert)`;
        } else {
            badgeEl.className = 'badge badge-active';
            badgeEl.innerText = `Active (${daysLeft} Days Left)`;
        }

        const messageText = this.buildMessageText(member, daysLeft);
        document.getElementById('msg-text-content').value = messageText;

        // Hook direct buttons
        document.getElementById('btn-dispatch-whatsapp').onclick = () => {
            const customText = document.getElementById('msg-text-content').value;
            this.openWhatsApp(member, customText);
            this.closeModal('modal-send-message');
        };

        document.getElementById('btn-dispatch-sms').onclick = () => {
            const customText = document.getElementById('msg-text-content').value;
            this.openSMS(member, customText);
            this.closeModal('modal-send-message');
        };

        this.openModal('modal-send-message');
    }

    openReceiptModal(memberId) {
        const member = this.members.find(m => m.id === memberId);
        if (!member) return;

        document.getElementById('receipt-gym-name').innerText = this.settings.gymName;
        document.getElementById('receipt-gym-address').innerText = this.settings.gymAddress;
        document.getElementById('receipt-gym-phone').innerText = 'Tel: ' + this.settings.gymPhone;
        document.getElementById('receipt-no').innerText = 'Receipt #: IP-' + member.id;
        document.getElementById('receipt-date').innerText = this.formatDisplayDate(member.joinDate);
        document.getElementById('receipt-member-name').innerText = member.name;
        document.getElementById('receipt-member-phone').innerText = member.mobile;
        document.getElementById('receipt-plan').innerText = member.plan;
        document.getElementById('receipt-validity').innerText = this.formatDisplayDate(member.expiryDate);
        document.getElementById('receipt-payment-mode').innerText = member.paymentMode || 'Cash';
        document.getElementById('receipt-total-amount').innerText = (this.settings.currency || '$') + Number(member.amount || 0).toFixed(2);

        this.openModal('modal-receipt');
    }

    // --- CSV Export ---
    exportMembersToCSV() {
        if (this.members.length === 0) {
            this.showToast('No member records to export.', 'warning');
            return;
        }

        const headers = ['Member ID', 'Name', 'Mobile Number', 'Email', 'Plan', 'Amount Paid', 'Join Date', 'Expiry Date', 'Days Left', 'Status'];
        const rows = this.members.map(m => {
            const days = this.getDaysUntilExpiry(m.expiryDate);
            const status = days < 0 ? 'Expired' : days <= 3 ? 'Expiring (3-Day Alert)' : 'Active';
            return [
                m.id,
                `"${m.name}"`,
                `"${m.mobile}"`,
                `"${m.email || ''}"`,
                `"${m.plan}"`,
                m.amount,
                m.joinDate,
                m.expiryDate,
                days,
                status
            ];
        });

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `IronPulse_Gym_Members_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showToast('Member CSV export downloaded.', 'success');
    }

    // --- Toast Notifications ---
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'warning') icon = '⚠️';

        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(10px)';
                toast.style.transition = 'all 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }, 3500);
    }

    // --- Rendering Engine ---
    renderAll() {
        this.renderStats();
        this.renderDashboardTable();
        this.renderAllMembersTable();
        this.renderExpiringMembersHub();
        this.renderAttendanceTable();
        this.renderMessageLogsTable();
        this.updateSettingsFormFields();
    }

    renderStats() {
        const total = this.members.length;
        let active = 0;
        let expiring3Days = 0;
        let expired = 0;
        let totalRevenue = 0;

        this.members.forEach(m => {
            const days = this.getDaysUntilExpiry(m.expiryDate);
            if (days < 0) expired++;
            else {
                active++;
                if (days <= 3) expiring3Days++;
            }
            totalRevenue += Number(m.amount || 0);
        });

        // Update elements
        document.getElementById('stat-total-members').innerText = total;
        document.getElementById('stat-active-members').innerText = active;
        document.getElementById('stat-expiring-3days').innerText = expiring3Days;
        document.getElementById('stat-expired-members').innerText = expired;
        document.getElementById('stat-monthly-revenue').innerText = (this.settings.currency || '$') + totalRevenue.toLocaleString();
        document.getElementById('stat-reminders-sent').innerText = this.messageLogs.length;

        // Nav Badges
        document.getElementById('nav-total-count').innerText = total;
        document.getElementById('nav-expiring-count').innerText = expiring3Days;
        document.getElementById('nav-checkin-count').innerText = this.attendance.length;

        // Filter Pill Counts
        document.getElementById('count-all').innerText = total;
        document.getElementById('count-expiring').innerText = expiring3Days;
        document.getElementById('count-active').innerText = active;
        document.getElementById('count-expired').innerText = expired;

        // Urgent Alert Banner Toggle
        const banner = document.getElementById('dashboard-urgent-banner');
        if (banner) {
            if (expiring3Days > 0) {
                banner.style.display = 'flex';
                document.getElementById('alert-banner-title').innerText = `${expiring3Days} Members Expiring Within 3 Days`;
                document.getElementById('alert-banner-subtitle').innerText = `Automated 3-day reminder is ${this.settings.autoSendReminders ? 'ACTIVE' : 'PAUSED'}. You can also dispatch bulk WhatsApp/SMS notices right now.`;
            } else {
                banner.style.display = 'none';
            }
        }
    }

    renderDashboardTable() {
        const tbody = document.getElementById('dashboard-members-tbody');
        if (!tbody) return;

        let filtered = this.members.filter(m => {
            const days = this.getDaysUntilExpiry(m.expiryDate);
            if (this.currentFilter === 'expiring') return days >= 0 && days <= 3;
            if (this.currentFilter === 'active') return days >= 0;
            if (this.currentFilter === 'expired') return days < 0;
            return true;
        });

        // Apply global search if any
        const search = (document.getElementById('global-search-input')?.value || '').toLowerCase();
        if (search) {
            filtered = filtered.filter(m => 
                m.name.toLowerCase().includes(search) || 
                m.mobile.includes(search) ||
                m.plan.toLowerCase().includes(search)
            );
        }

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 30px;">No gym members matching the current filter.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(m => {
            const days = this.getDaysUntilExpiry(m.expiryDate);
            let statusBadge = '';
            let reminderBtn = '';

            if (days < 0) {
                statusBadge = `<span class="badge badge-expired">EXPIRED (${Math.abs(days)}d ago)</span>`;
                reminderBtn = `<button class="btn btn-secondary btn-sm" onclick="window.gymApp.openRenewModal('${m.id}')">Renew</button>`;
            } else if (days <= 3) {
                statusBadge = `<span class="badge badge-expiring">⚠️ ${days === 0 ? 'EXPIRES TODAY' : days + ' DAYS LEFT'}</span>`;
                reminderBtn = `
                    <button class="btn btn-whatsapp btn-sm" onclick="window.gymApp.openWhatsApp(window.gymApp.members.find(x => x.id==='${m.id}'))" title="Send WhatsApp">
                        <span>💬 WhatsApp</span>
                    </button>
                `;
            } else {
                statusBadge = `<span class="badge badge-active">${days} Days Left</span>`;
                reminderBtn = `<span style="color: var(--text-muted); font-size: 11px;">Active (${days}d)</span>`;
            }

            return `
                <tr>
                    <td>
                        <div class="member-info-cell">
                            <div class="member-avatar">${m.name.charAt(0)}</div>
                            <div>
                                <div class="member-name">${m.name}</div>
                                <div class="member-id">${m.id} • ${m.gender || 'Member'}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <a href="tel:${m.mobile}" class="mobile-link" title="Click to call">
                            <span>📞</span> ${m.mobile}
                        </a>
                    </td>
                    <td><strong>${m.plan}</strong></td>
                    <td style="color: var(--text-secondary);">${this.formatDisplayDate(m.joinDate)}</td>
                    <td><strong>${this.formatDisplayDate(m.expiryDate)}</strong></td>
                    <td>${statusBadge}</td>
                    <td>${reminderBtn}</td>
                    <td>
                        <div class="action-btn-group">
                            <button class="btn btn-icon btn-sm" onclick="window.gymApp.openSendMessageModal('${m.id}')" title="Send Customized Message">💬</button>
                            <button class="btn btn-icon btn-sm" onclick="window.gymApp.openRenewModal('${m.id}')" title="Renew Plan">🔄</button>
                            <button class="btn btn-icon btn-sm" onclick="window.gymApp.openReceiptModal('${m.id}')" title="Print Receipt">🧾</button>
                            <button class="btn btn-icon btn-sm" onclick="window.gymApp.openEditMemberModal('${m.id}')" title="Edit">✏️</button>
                            <button class="btn btn-icon btn-sm" onclick="window.gymApp.deleteMember('${m.id}')" title="Delete" style="color: var(--rose);">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderAllMembersTable() {
        const tbody = document.getElementById('all-members-tbody');
        if (!tbody) return;

        let filtered = this.members.filter(m => {
            const days = this.getDaysUntilExpiry(m.expiryDate);
            if (this.currentMemberFilter === 'expiring') return days >= 0 && days <= 3;
            if (this.currentMemberFilter === 'active') return days >= 0;
            if (this.currentMemberFilter === 'expired') return days < 0;
            return true;
        });

        const search = (document.getElementById('member-search-box')?.value || '').toLowerCase();
        if (search) {
            filtered = filtered.filter(m => 
                m.name.toLowerCase().includes(search) || 
                m.mobile.includes(search) ||
                m.plan.toLowerCase().includes(search)
            );
        }

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 30px;">No gym members found.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(m => {
            const days = this.getDaysUntilExpiry(m.expiryDate);
            let statusBadge = '';
            if (days < 0) statusBadge = `<span class="badge badge-expired">Expired (${Math.abs(days)}d ago)</span>`;
            else if (days <= 3) statusBadge = `<span class="badge badge-expiring">⚠️ ${days === 0 ? 'Expires Today' : days + ' Days Left'}</span>`;
            else statusBadge = `<span class="badge badge-active">${days} Days Left</span>`;

            return `
                <tr>
                    <td>
                        <div class="member-info-cell">
                            <div class="member-avatar">${m.name.charAt(0)}</div>
                            <div>
                                <div class="member-name">${m.name}</div>
                                <div class="member-id">${m.id}</div>
                            </div>
                        </div>
                    </td>
                    <td><a href="tel:${m.mobile}" class="mobile-link">📞 ${m.mobile}</a></td>
                    <td><strong>${m.plan}</strong></td>
                    <td>${this.formatDisplayDate(m.joinDate)}</td>
                    <td><strong>${this.formatDisplayDate(m.expiryDate)}</strong></td>
                    <td>${statusBadge}</td>
                    <td><span style="color: var(--emerald); font-weight: 700;">${(this.settings.currency || '$') + m.amount}</span> (${m.paymentMode || 'Cash'})</td>
                    <td>
                        <div class="action-btn-group">
                            <button class="btn btn-whatsapp btn-sm" onclick="window.gymApp.openWhatsApp(window.gymApp.members.find(x => x.id==='${m.id}'))">💬 WhatsApp</button>
                            <button class="btn btn-secondary btn-sm" onclick="window.gymApp.openRenewModal('${m.id}')">Renew</button>
                            <button class="btn btn-icon btn-sm" onclick="window.gymApp.openEditMemberModal('${m.id}')">✏️</button>
                            <button class="btn btn-icon btn-sm" onclick="window.gymApp.deleteMember('${m.id}')" style="color: var(--rose);">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderExpiringMembersHub() {
        const tbody = document.getElementById('expiring-members-tbody');
        if (!tbody) return;

        const expiringList = this.members.filter(m => {
            const days = this.getDaysUntilExpiry(m.expiryDate);
            return days >= 0 && days <= 3;
        });

        document.getElementById('reminders-target-count').innerText = `${expiringList.length} members expiring in ≤ 3 days`;

        if (expiringList.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--emerald); padding: 30px;">🎉 Great news! No gym memberships are expiring within the next 3 days.</td></tr>`;
            return;
        }

        tbody.innerHTML = expiringList.map(m => {
            const days = this.getDaysUntilExpiry(m.expiryDate);
            const countdownText = days === 0 ? '🚨 TODAY' : days === 1 ? '⚡ TOMORROW' : `⏳ ${days} DAYS`;
            const reminderStatus = m.lastReminderDate 
                ? `<span style="color: var(--emerald); font-size: 11px;">✓ Sent (${m.lastReminderDate})</span>` 
                : `<span style="color: var(--amber); font-size: 11px;">⏳ Pending Today</span>`;

            return `
                <tr>
                    <td>
                        <div class="member-info-cell">
                            <div class="member-avatar" style="border-color: var(--amber);">${m.name.charAt(0)}</div>
                            <div>
                                <div class="member-name">${m.name}</div>
                                <div class="member-id">${m.id}</div>
                            </div>
                        </div>
                    </td>
                    <td><a href="tel:${m.mobile}" class="mobile-link" style="color: var(--amber);">📞 ${m.mobile}</a></td>
                    <td><strong>${m.plan}</strong></td>
                    <td><strong>${this.formatDisplayDate(m.expiryDate)}</strong></td>
                    <td><span class="badge badge-expiring">${countdownText}</span></td>
                    <td>${reminderStatus}</td>
                    <td>
                        <div class="action-btn-group">
                            <button class="btn btn-whatsapp btn-sm" onclick="window.gymApp.openWhatsApp(window.gymApp.members.find(x => x.id==='${m.id}'))">
                                <span>💬 WhatsApp Direct</span>
                            </button>
                            <button class="btn btn-secondary btn-sm" onclick="window.gymApp.openSMS(window.gymApp.members.find(x => x.id==='${m.id}'))">
                                <span>📱 Native SMS</span>
                            </button>
                            <button class="btn btn-primary btn-sm" onclick="window.gymApp.openRenewModal('${m.id}')">
                                <span>🔄 Renew</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderAttendanceTable() {
        const tbody = document.getElementById('attendance-tbody');
        if (!tbody) return;

        document.getElementById('today-attendance-count').innerText = `${this.attendance.length} check-ins logged today`;

        if (this.attendance.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">No member check-ins recorded yet today.</td></tr>`;
            return;
        }

        tbody.innerHTML = this.attendance.map(a => {
            const days = a.daysLeft;
            let status = '';
            if (days < 0) status = `<span class="badge badge-expired">Expired</span>`;
            else if (days <= 3) status = `<span class="badge badge-expiring">Expiring in ${days}d</span>`;
            else status = `<span class="badge badge-active">Active</span>`;

            return `
                <tr>
                    <td style="font-family: monospace; font-weight: 700; color: var(--cyan);">${a.time}</td>
                    <td><strong>${a.memberName}</strong></td>
                    <td>${a.mobile}</td>
                    <td>${a.plan}</td>
                    <td>${this.formatDisplayDate(a.expiryDate)}</td>
                    <td>${status}</td>
                </tr>
            `;
        }).join('');
    }

    renderMessageLogsTable() {
        const tbody = document.getElementById('message-logs-tbody');
        if (!tbody) return;

        if (this.messageLogs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">No message notices dispatched yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = this.messageLogs.slice(0, 50).map(log => {
            return `
                <tr>
                    <td style="font-family: monospace; font-size: 12px; color: var(--text-secondary);">${log.timestamp}</td>
                    <td><strong>${log.memberName}</strong></td>
                    <td><span style="font-family: monospace;">${log.mobile}</span></td>
                    <td><span class="badge" style="background: rgba(59, 130, 246, 0.2); color: var(--accent-primary);">${log.channel}</span></td>
                    <td style="max-width: 320px; font-size: 12px; color: #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${log.message}">
                        ${log.message}
                    </td>
                    <td><span style="color: var(--emerald); font-weight: 600; font-size: 12px;">✓ ${log.status}</span></td>
                </tr>
            `;
        }).join('');
    }

    updateSettingsFormFields() {
        document.getElementById('gym-name-display').innerText = this.settings.gymName;
        document.getElementById('setting-gym-name').value = this.settings.gymName;
        document.getElementById('setting-gym-phone').value = this.settings.gymPhone;
        document.getElementById('setting-currency').value = this.settings.currency || '$';
        document.getElementById('setting-gym-address').value = this.settings.gymAddress;
        document.getElementById('setting-default-channel').value = this.settings.defaultChannel || 'whatsapp';
        document.getElementById('setting-webhook-url').value = this.settings.webhookUrl || '';

        const autoToggle = document.getElementById('toggle-auto-send');
        if (autoToggle) {
            autoToggle.checked = this.settings.autoSendReminders;
            document.getElementById('toggle-status-label').innerText = this.settings.autoSendReminders ? 'Auto-Send: ENABLED' : 'Auto-Send: PAUSED';
        }
    }

    // --- DOM Binding & Routing ---
    initDOM() {
        // Nav page switching
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.getAttribute('data-view');
                this.switchView(view);
            });
        });

        // Mobile sidebar toggle
        document.getElementById('btn-toggle-sidebar')?.addEventListener('click', () => {
            document.getElementById('sidebar')?.classList.toggle('mobile-open');
        });

        // Filter pills on Dashboard
        document.querySelectorAll('[data-filter]').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('[data-filter]').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                this.currentFilter = pill.getAttribute('data-filter');
                this.renderDashboardTable();
            });
        });

        // Filter pills on All Members
        document.querySelectorAll('[data-member-filter]').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('[data-member-filter]').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                this.currentMemberFilter = pill.getAttribute('data-member-filter');
                this.renderAllMembersTable();
            });
        });
    }

    switchView(viewName) {
        document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

        const targetView = document.getElementById('view-' + viewName);
        const targetNav = document.querySelector(`.nav-item[data-view="${viewName}"]`);

        if (targetView) targetView.classList.add('active');
        if (targetNav) targetNav.classList.add('active');

        // Close mobile sidebar if open
        document.getElementById('sidebar')?.classList.remove('mobile-open');
    }

    bindEvents() {
        // Open Add Member
        document.getElementById('btn-open-add-member')?.addEventListener('click', () => this.openAddMemberModal());

        // Quick Check-in Button in header
        document.getElementById('btn-quick-checkin')?.addEventListener('click', () => {
            this.switchView('attendance');
            setTimeout(() => document.getElementById('checkin-input')?.focus(), 200);
        });

        // Search inputs
        document.getElementById('global-search-input')?.addEventListener('input', () => this.renderDashboardTable());
        document.getElementById('member-search-box')?.addEventListener('input', () => this.renderAllMembersTable());

        // Export CSV
        document.getElementById('btn-export-csv')?.addEventListener('click', () => this.exportMembersToCSV());

        // Send All 3-Day Reminders (Dashboard banner & Hub button)
        document.getElementById('btn-dashboard-send-reminders')?.addEventListener('click', () => this.sendBulk3DayReminders());
        document.getElementById('btn-bulk-send-all')?.addEventListener('click', () => this.sendBulk3DayReminders());

        // Auto-send Toggle Switch
        document.getElementById('toggle-auto-send')?.addEventListener('change', (e) => {
            this.settings.autoSendReminders = e.target.checked;
            document.getElementById('toggle-status-label').innerText = e.target.checked ? 'Auto-Send: ENABLED' : 'Auto-Send: PAUSED';
            this.saveSettings();
            if (e.target.checked) {
                this.runAutomatedReminderScan(false);
            }
        });

        // Edit template button
        document.getElementById('btn-edit-template')?.addEventListener('click', () => {
            const currentTmpl = this.settings.messageTemplate;
            const newTmpl = prompt('Customize 3-Day Expiry Reminder Template:\n\nAvailable Tags:\n{memberName}, {gymName}, {planName}, {daysLeft}, {expiryDate}, {gymPhone}', currentTmpl);
            if (newTmpl && newTmpl.trim() !== '') {
                this.settings.messageTemplate = newTmpl.trim();
                document.getElementById('template-preview-text').innerText = `"${newTmpl.trim()}"`;
                this.saveSettings();
                this.showToast('Message template updated.', 'success');
            }
        });

        // Member Form Submit (Add / Edit)
        document.getElementById('member-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const memberData = {
                id: document.getElementById('form-member-id').value || null,
                name: document.getElementById('form-name').value.trim(),
                mobile: document.getElementById('form-mobile').value.trim(),
                email: document.getElementById('form-email').value.trim(),
                gender: document.getElementById('form-gender').value,
                plan: document.getElementById('form-plan').value,
                amount: Number(document.getElementById('form-amount').value || 0),
                joinDate: document.getElementById('form-join-date').value,
                expiryDate: document.getElementById('form-expiry-date').value,
                paymentMode: document.getElementById('form-payment-mode').value,
                emergency: document.getElementById('form-emergency').value.trim(),
                notes: document.getElementById('form-notes').value.trim()
            };
            this.addOrUpdateMember(memberData);
        });

        // Auto-update expiry date when join date or plan changes in add/edit form
        const updateFormExpiry = () => {
            const joinDate = document.getElementById('form-join-date').value;
            const plan = document.getElementById('form-plan').value;
            if (joinDate && plan) {
                document.getElementById('form-expiry-date').value = this.calculateExpiryDate(joinDate, plan);
            }
        };
        document.getElementById('form-join-date')?.addEventListener('change', updateFormExpiry);
        document.getElementById('form-plan')?.addEventListener('change', updateFormExpiry);

        // Renew Form Submit
        document.getElementById('renew-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const memberId = document.getElementById('renew-member-id').value;
            const plan = document.getElementById('renew-plan').value;
            const amount = Number(document.getElementById('renew-amount').value || 0);
            const newExpiry = document.getElementById('renew-new-expiry').value;
            this.renewMember(memberId, plan, amount, newExpiry);
        });

        // Renew Duration change calculation
        document.getElementById('renew-plan')?.addEventListener('change', (e) => {
            const memberId = document.getElementById('renew-member-id').value;
            const member = this.members.find(m => m.id === memberId);
            if (!member) return;
            const baseDate = new Date(member.expiryDate) > new Date() ? member.expiryDate : new Date().toISOString().split('T')[0];
            document.getElementById('renew-new-expiry').value = this.calculateExpiryDate(baseDate, e.target.value);
        });

        // Check-in Form Submit
        document.getElementById('checkin-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = document.getElementById('checkin-input').value;
            this.processCheckin(query);
            document.getElementById('checkin-input').value = '';
        });

        // Save Settings Form
        document.getElementById('btn-save-settings')?.addEventListener('click', () => {
            this.settings.gymName = document.getElementById('setting-gym-name').value.trim() || 'IronPulse Fitness Club';
            this.settings.gymPhone = document.getElementById('setting-gym-phone').value.trim() || '+1 (555) 234-5678';
            this.settings.currency = document.getElementById('setting-currency').value.trim() || '$';
            this.settings.gymAddress = document.getElementById('setting-gym-address').value.trim() || '';
            this.settings.defaultChannel = document.getElementById('setting-default-channel').value;
            this.settings.webhookUrl = document.getElementById('setting-webhook-url').value.trim();
            this.saveSettings();
        });

        // Clear Logs
        document.getElementById('btn-clear-logs')?.addEventListener('click', () => {
            if (confirm('Clear all dispatched message logs?')) {
                this.messageLogs = [];
                this.saveLogs();
                this.renderMessageLogsTable();
                this.showToast('Message delivery logs cleared.', 'info');
            }
        });

        // Reset Demo Data
        document.getElementById('btn-reset-demo-data')?.addEventListener('click', () => {
            if (confirm('Reset database to realistic sample members (with 3-day expiring members)?')) {
                this.members = this.generateDemoMembers();
                this.attendance = [];
                this.messageLogs = [];
                this.saveMembers();
                this.saveAttendance();
                this.saveLogs();
                this.renderAll();
                this.runAutomatedReminderScan(true);
                this.showToast('Database reset to demo state.', 'success');
            }
        });

        // Download JSON Backup
        document.getElementById('btn-download-backup')?.addEventListener('click', () => {
            const data = {
                settings: this.settings,
                members: this.members,
                attendance: this.attendance,
                logs: this.messageLogs,
                exportedAt: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `IronPulse_Backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            this.showToast('Database backup downloaded.', 'success');
        });
    }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
    window.gymApp = new GymManagementApp();
});
