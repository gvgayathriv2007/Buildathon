/**
 * CampusFindIt - Next Gen Frontend Application Logic
 * 2nd Year CSE Buildathon Edition (JWT Auth, File Uploads, Pagination & CRUD)
 * Supports GitHub Pages cross-origin API bridging
 */

// API Base URL - Relative path works natively on Vercel standalone deployment & local server
const API_BASE_URL = '';

// Application State
const state = {
    items: [],
    selectedType: '',
    selectedStatus: '',
    selectedCategory: 'All',
    searchQuery: '',
    showMyItems: false,
    page: 1,
    limit: 6,
    totalPages: 1,
    totalItems: 0,
    currentItemId: null,
    user: JSON.parse(localStorage.getItem('campus_user') || 'null'),
    token: localStorage.getItem('campus_token') || null
};

// Category Unsplash Cover Presets
const categoryDefaultImages = {
    "Electronics": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80",
    "ID & Wallet": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80",
    "Keys": "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&q=80",
    "Books": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80",
    "Apparel": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80",
    "Other": "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&q=80"
};

function getSmartItemImage(item) {
    if (!item) return categoryDefaultImages['Other'];
    
    const genericBoxImg = "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=500&q=80";
    
    if (item.image_url && item.image_url.trim() !== '' && !item.image_url.includes('1584438784894-089d6a62b8fa')) {
        let url = item.image_url;
        if (url.startsWith('/uploads/')) url = `${API_BASE_URL}${url}`;
        return url;
    }
    
    const t = ((item.title || '') + ' ' + (item.description || '')).toLowerCase();
    
    if (t.includes('calculator')) return "https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48a?w=600&q=80";
    if (t.includes('airdopes') || t.includes('earbud') || t.includes('headphone') || t.includes('airpods') || t.includes('boat')) return "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80";
    if (t.includes('laptop') || t.includes('macbook') || t.includes('dell') || t.includes('hp') || t.includes('lenovo')) return "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80";
    if (t.includes('phone') || t.includes('iphone') || t.includes('mobile') || t.includes('samsung') || t.includes('oneplus')) return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80";
    if (t.includes('watch') || t.includes('smartwatch') || t.includes('casio')) return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80";
    if (t.includes('id') || t.includes('card') || t.includes('wallet') || t.includes('purse')) return "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80";
    if (t.includes('key') || t.includes('keychain') || t.includes('batman')) return "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&q=80";
    if (t.includes('book') || t.includes('notes') || t.includes('notebook') || t.includes('cormen') || t.includes('textbook')) return "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80";
    if (t.includes('jacket') || t.includes('bag') || t.includes('backpack') || t.includes('denim') || t.includes('hoodie') || t.includes('shirt') || t.includes('apparel')) return "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80";
    if (t.includes('bottle') || t.includes('flask') || t.includes('water')) return "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80";
    if (t.includes('pen') || t.includes('pencil') || t.includes('stationery')) return "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&q=80";
    if (t.includes('umbrella')) return "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=600&q=80";

    return categoryDefaultImages[item.category] || categoryDefaultImages['Other'] || genericBoxImg;
}

// DOM References
const elements = {
    statTotal: document.getElementById('stat-total'),
    statLost: document.getElementById('stat-lost'),
    statFound: document.getElementById('stat-found'),
    statReunited: document.getElementById('stat-reunited'),
    
    // Auth DOM
    btnOpenAuthModal: document.getElementById('btn-open-auth-modal'),
    userPillDropdown: document.getElementById('user-pill-dropdown'),
    userAvatarInitial: document.getElementById('user-avatar-initial'),
    userDisplayName: document.getElementById('user-display-name'),
    btnLogout: document.getElementById('btn-logout'),
    tabMyListings: document.getElementById('tab-my-listings'),
    
    authModal: document.getElementById('auth-modal'),
    btnCloseAuth: document.getElementById('btn-close-auth'),
    btnCancelAuth: document.getElementById('btn-cancel-auth'),
    btnCancelReg: document.getElementById('btn-cancel-reg'),
    tabLoginBtn: document.getElementById('tab-login-btn'),
    tabRegisterBtn: document.getElementById('tab-register-btn'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),

    searchInput: document.getElementById('search-input'),
    statusTabsGroup: document.getElementById('status-tabs-group'),
    categorySelect: document.getElementById('category-select'),
    categoryQuickbar: document.getElementById('category-quickbar'),
    
    sectionHeading: document.getElementById('section-heading'),
    countBadgePill: document.getElementById('count-badge-pill'),
    cardsGrid: document.getElementById('cards-grid'),
    emptyStateBox: document.getElementById('empty-state-box'),
    btnResetFilters: document.getElementById('btn-reset-filters'),
    
    // Pagination
    pagePrevBtn: document.getElementById('page-prev-btn'),
    pageNextBtn: document.getElementById('page-next-btn'),
    pageIndicator: document.getElementById('page-indicator'),
    
    // Report Modal
    reportModal: document.getElementById('report-modal'),
    btnOpenReportModal: document.getElementById('btn-open-report-modal'),
    fabReportBtn: document.getElementById('fab-report-btn'),
    btnCloseReport: document.getElementById('btn-close-report'),
    btnCancelReport: document.getElementById('btn-cancel-report'),
    reportForm: document.getElementById('report-form'),
    formDate: document.getElementById('form_date'),
    formImageFile: document.getElementById('form_image_file'),
    
    // Edit Modal
    editModal: document.getElementById('edit-modal'),
    btnCloseEdit: document.getElementById('btn-close-edit'),
    btnCancelEdit: document.getElementById('btn-cancel-edit'),
    editForm: document.getElementById('edit-form'),

    // Details Modal
    detailsModal: document.getElementById('details-modal'),
    btnCloseDetails: document.getElementById('btn-close-details'),
    detailTypeBadge: document.getElementById('detail-type-badge'),
    detailImg: document.getElementById('detail-img'),
    detailTitle: document.getElementById('detail-title'),
    detailCategory: document.getElementById('detail-category'),
    detailLocation: document.getElementById('detail-location'),
    detailDate: document.getElementById('detail-date'),
    detailDesc: document.getElementById('detail-desc'),
    detailContactPerson: document.getElementById('detail-contact-person'),
    detailContactInfo: document.getElementById('detail-contact-info'),
    btnMarkReunited: document.getElementById('btn-mark-reunited'),
    btnOpenEditItem: document.getElementById('btn-open-edit-item'),
    btnDeleteItem: document.getElementById('btn-delete-item'),
    
    // Smart Match Engine DOM
    btnOpenSmartMatch: document.getElementById('btn-open-smart-match'),
    btnDetailSmartMatch: document.getElementById('btn-detail-smart-match'),
    smartMatchModal: document.getElementById('smart-match-modal'),
    btnCloseSmartMatch: document.getElementById('btn-close-smart-match'),
    smartMatchItemSelect: document.getElementById('smart-match-item-select'),
    smartMatchTargetBanner: document.getElementById('smart-match-target-banner'),
    matchTargetType: document.getElementById('match-target-type'),
    matchTargetTitle: document.getElementById('match-target-title'),
    matchTargetMeta: document.getElementById('match-target-meta'),
    smartMatchResultsContainer: document.getElementById('smart-match-results-container'),
    
    // Data Migration Engine DOM
    btnOpenMigrationModal: document.getElementById('btn-open-migration-modal'),
    migrationModal: document.getElementById('migration-modal'),
    btnCloseMigration: document.getElementById('btn-close-migration'),
    btnLoadSampleMigration: document.getElementById('btn-load-sample-migration'),
    btnRunMigration: document.getElementById('btn-run-migration'),
    migrationRawInput: document.getElementById('migration-raw-input'),
    migrationDashboard: document.getElementById('migration-dashboard'),
    migStatRaw: document.getElementById('mig-stat-raw'),
    migStatImported: document.getElementById('mig-stat-imported'),
    migStatDuplicate: document.getElementById('mig-stat-duplicate'),
    migStatRejected: document.getElementById('mig-stat-rejected'),
    migStatSuccessRate: document.getElementById('mig-stat-success-rate'),
    migEvidenceTabs: document.getElementById('mig-evidence-tabs'),
    migEvidenceContainer: document.getElementById('mig-evidence-container'),
    
    toastStack: document.getElementById('toast-stack')
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    if (elements.formDate) {
        elements.formDate.value = new Date().toISOString().split('T')[0];
    }
    
    updateAuthUI();
    setupEventListeners();
    fetchStats();
    fetchItems();
});

// Update Auth Header Bar UI
function updateAuthUI() {
    if (state.user && state.token) {
        elements.btnOpenAuthModal.classList.add('hidden');
        elements.userPillDropdown.classList.remove('hidden');
        elements.userAvatarInitial.textContent = (state.user.name || 'S').charAt(0).toUpperCase();
        elements.userDisplayName.textContent = state.user.name.split(' ')[0];
        if (elements.tabMyListings) elements.tabMyListings.classList.remove('hidden');
    } else {
        elements.btnOpenAuthModal.classList.remove('hidden');
        elements.userPillDropdown.classList.add('hidden');
        if (elements.tabMyListings) elements.tabMyListings.classList.add('hidden');
    }
}

function setupEventListeners() {
    // Auth Modal Triggers
    elements.btnOpenAuthModal.addEventListener('click', () => elements.authModal.classList.remove('hidden'));
    elements.btnCloseAuth.addEventListener('click', () => elements.authModal.classList.add('hidden'));
    if (elements.btnCancelAuth) elements.btnCancelAuth.addEventListener('click', () => elements.authModal.classList.add('hidden'));
    if (elements.btnCancelReg) elements.btnCancelReg.addEventListener('click', () => elements.authModal.classList.add('hidden'));

    // Auth Tab Switcher
    elements.tabLoginBtn.addEventListener('click', () => {
        elements.tabLoginBtn.classList.add('active');
        elements.tabRegisterBtn.classList.remove('active');
        elements.loginForm.classList.remove('hidden');
        elements.registerForm.classList.add('hidden');
    });

    elements.tabRegisterBtn.addEventListener('click', () => {
        elements.tabRegisterBtn.classList.add('active');
        elements.tabLoginBtn.classList.remove('active');
        elements.registerForm.classList.remove('hidden');
        elements.loginForm.classList.add('hidden');
    });

    // Login & Register Form Submissions
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.registerForm.addEventListener('submit', handleRegister);
    elements.btnLogout.addEventListener('click', handleLogout);

    // Search input
    elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim();
        state.page = 1;
        fetchItems();
    });

    // Ctrl + K shortcut
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            elements.searchInput.focus();
        }
    });

    // Quick category pills bar
    elements.categoryQuickbar.querySelectorAll('.cat-pill').forEach(pill => {
        pill.addEventListener('click', (e) => {
            elements.categoryQuickbar.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            
            const cat = target.getAttribute('data-cat');
            state.selectedCategory = cat;
            elements.categorySelect.value = cat;
            state.page = 1;
            fetchItems();
        });
    });

    // Category dropdown
    elements.categorySelect.addEventListener('change', (e) => {
        const cat = e.target.value;
        state.selectedCategory = cat;
        
        elements.categoryQuickbar.querySelectorAll('.cat-pill').forEach(pill => {
            pill.classList.toggle('active', pill.getAttribute('data-cat') === cat);
        });
        
        state.page = 1;
        fetchItems();
    });

    // Status filter tabs
    elements.statusTabsGroup.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            elements.statusTabsGroup.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            
            state.selectedType = target.getAttribute('data-type') || '';
            state.selectedStatus = target.getAttribute('data-status') || '';
            state.showMyItems = target.getAttribute('data-my') === '1';
            state.page = 1;
            fetchItems();
        });
    });

    // Reset filters
    elements.btnResetFilters.addEventListener('click', () => {
        state.searchQuery = '';
        state.selectedType = '';
        state.selectedStatus = '';
        state.selectedCategory = 'All';
        state.showMyItems = false;
        state.page = 1;
        
        elements.searchInput.value = '';
        elements.categorySelect.value = 'All';
        
        elements.categoryQuickbar.querySelectorAll('.cat-pill').forEach((p, idx) => p.classList.toggle('active', idx === 0));
        elements.statusTabsGroup.querySelectorAll('.tab-btn').forEach((b, idx) => b.classList.toggle('active', idx === 0));
        
        fetchItems();
    });

    // Pagination handlers
    elements.pagePrevBtn.addEventListener('click', () => {
        if (state.page > 1) {
            state.page--;
            fetchItems();
        }
    });

    elements.pageNextBtn.addEventListener('click', () => {
        if (state.page < state.totalPages) {
            state.page++;
            fetchItems();
        }
    });

    // Report modal handlers
    const openReport = () => elements.reportModal.classList.remove('hidden');
    const closeReport = () => {
        elements.reportModal.classList.add('hidden');
        elements.reportForm.reset();
        if (elements.formDate) elements.formDate.value = new Date().toISOString().split('T')[0];
    };

    elements.btnOpenReportModal.addEventListener('click', openReport);
    if (elements.fabReportBtn) elements.fabReportBtn.addEventListener('click', openReport);
    elements.btnCloseReport.addEventListener('click', closeReport);
    elements.btnCancelReport.addEventListener('click', closeReport);
    elements.reportForm.addEventListener('submit', handleReportSubmit);

    // Edit modal handlers
    elements.btnCloseEdit.addEventListener('click', () => elements.editModal.classList.add('hidden'));
    elements.btnCancelEdit.addEventListener('click', () => elements.editModal.classList.add('hidden'));
    elements.editForm.addEventListener('submit', handleEditSubmit);

    // Details modal handlers
    elements.btnCloseDetails.addEventListener('click', () => elements.detailsModal.classList.add('hidden'));
    elements.btnMarkReunited.addEventListener('click', handleMarkReunited);
    elements.btnDeleteItem.addEventListener('click', handleDeleteItem);
    elements.btnOpenEditItem.addEventListener('click', openEditModal);

    // Smart Match Modal triggers
    if (elements.btnOpenSmartMatch) {
        elements.btnOpenSmartMatch.addEventListener('click', () => openSmartMatchModal());
    }
    if (elements.btnDetailSmartMatch) {
        elements.btnDetailSmartMatch.addEventListener('click', () => {
            const currentId = state.currentItemId;
            elements.detailsModal.classList.add('hidden');
            openSmartMatchModal(currentId);
        });
    }
    if (elements.btnCloseSmartMatch) {
        elements.btnCloseSmartMatch.addEventListener('click', () => elements.smartMatchModal.classList.add('hidden'));
    }
    if (elements.smartMatchItemSelect) {
        elements.smartMatchItemSelect.addEventListener('change', (e) => {
            const selectedId = parseInt(e.target.value, 10);
            if (selectedId) runSmartMatch(selectedId);
        });
    }

    // Data Migration Modal triggers
    if (elements.btnOpenMigrationModal) {
        elements.btnOpenMigrationModal.addEventListener('click', openMigrationModal);
    }
    if (elements.btnCloseMigration) {
        elements.btnCloseMigration.addEventListener('click', () => elements.migrationModal.classList.add('hidden'));
    }
    if (elements.btnLoadSampleMigration) {
        elements.btnLoadSampleMigration.addEventListener('click', loadSampleMigrationDataset);
    }
    if (elements.btnRunMigration) {
        elements.btnRunMigration.addEventListener('click', runDataMigrationPipeline);
    }
    if (elements.migEvidenceTabs) {
        elements.migEvidenceTabs.querySelectorAll('.auth-tab-btn').forEach(tabBtn => {
            tabBtn.addEventListener('click', (e) => {
                elements.migEvidenceTabs.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.remove('active'));
                const target = e.currentTarget;
                target.classList.add('active');
                const tabKey = target.getAttribute('data-mig-tab');
                renderMigrationEvidenceTab(tabKey);
            });
        });
    }

    // Background click dismiss
    window.addEventListener('click', (e) => {
        if (e.target === elements.reportModal) closeReport();
        if (e.target === elements.detailsModal) elements.detailsModal.classList.add('hidden');
        if (e.target === elements.authModal) elements.authModal.classList.add('hidden');
        if (e.target === elements.smartMatchModal) elements.smartMatchModal.classList.add('hidden');
        if (e.target === elements.migrationModal) elements.migrationModal.classList.add('hidden');
        if (e.target === elements.editModal) elements.editModal.classList.add('hidden');
    });
}

// Login Handler
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login_email').value.trim();
    const password = document.getElementById('login_password').value;

    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'bypass-tunnel-reminder': 'true'
            },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Login failed');

        state.token = data.token;
        state.user = data.user;
        localStorage.setItem('campus_token', data.token);
        localStorage.setItem('campus_user', JSON.stringify(data.user));

        showToast(`Welcome back, ${data.user.name}!`, 'success');
        updateAuthUI();
        elements.authModal.classList.add('hidden');
        elements.loginForm.reset();
        fetchItems();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// Register Handler
async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg_name').value.trim();
    const email = document.getElementById('reg_email').value.trim();
    const password = document.getElementById('reg_password').value;

    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'bypass-tunnel-reminder': 'true'
            },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Registration failed');

        state.token = data.token;
        state.user = data.user;
        localStorage.setItem('campus_token', data.token);
        localStorage.setItem('campus_user', JSON.stringify(data.user));

        showToast(`Account created! Welcome ${data.user.name}.`, 'success');
        updateAuthUI();
        elements.authModal.classList.add('hidden');
        elements.registerForm.reset();
        fetchItems();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// Logout Handler
function handleLogout() {
    state.token = null;
    state.user = null;
    state.showMyItems = false;
    localStorage.removeItem('campus_token');
    localStorage.removeItem('campus_user');

    showToast('Logged out successfully.', 'success');
    updateAuthUI();
    fetchItems();
}

// Fetch Stats from API
async function fetchStats() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/stats`, {
            headers: { 'bypass-tunnel-reminder': 'true' }
        });
        if (!res.ok) return;
        const data = await res.json();
        
        animateCounter(elements.statTotal, data.total || 0);
        animateCounter(elements.statLost, data.lost || 0);
        animateCounter(elements.statFound, data.found || 0);
        animateCounter(elements.statReunited, data.reunited || 0);
    } catch (err) {
        console.error('Error loading stats:', err);
    }
}

// Animated Counter Effect
function animateCounter(el, targetVal) {
    if (!el) return;
    const startVal = parseInt(el.textContent) || 0;
    const duration = 600;
    const steps = 20;
    const increment = (targetVal - startVal) / steps;
    let current = startVal;
    let stepCount = 0;

    const timer = setInterval(() => {
        stepCount++;
        current += increment;
        el.textContent = Math.round(current);
        if (stepCount >= steps) {
            el.textContent = targetVal;
            clearInterval(timer);
        }
    }, duration / steps);
}

// Fetch Items with Filters & Pagination
async function fetchItems() {
    try {
        const params = new URLSearchParams();
        if (state.selectedType) params.append('type', state.selectedType);
        if (state.selectedStatus) params.append('status', state.selectedStatus);
        if (state.selectedCategory && state.selectedCategory !== 'All') params.append('category', state.selectedCategory);
        if (state.searchQuery) params.append('search', state.searchQuery);
        if (state.showMyItems) params.append('my_items', '1');
        params.append('page', state.page);
        params.append('limit', state.limit);

        const headers = { 'bypass-tunnel-reminder': 'true' };
        if (state.token) headers['Authorization'] = `Bearer ${state.token}`;

        const res = await fetch(`${API_BASE_URL}/api/items?${params.toString()}`, { headers });
        if (!res.ok) throw new Error('API fetch failed');
        const data = await res.json();

        let items = [];
        if (data.pagination) {
            items = data.items;
            state.totalPages = data.pagination.totalPages;
            state.totalItems = data.pagination.total;
            renderPagination(data.pagination);
        } else {
            items = data;
            state.totalPages = 1;
            state.totalItems = items.length;
        }

        state.items = items;
        renderItems(items);
    } catch (err) {
        console.error('Fetch items error:', err);
        elements.cardsGrid.innerHTML = `
            <div class="empty-box">
                <div class="empty-icon-circle"><i class="fa-solid fa-triangle-exclamation" style="color: var(--lost-color);"></i></div>
                <h3>Unable to connect to Backend Server</h3>
                <p style="color: var(--text-muted);">Ensure backend server is running on ${API_BASE_URL || 'http://localhost:8080'}</p>
            </div>
        `;
    }
}

// Render Pagination UI Controls
function renderPagination(pagination) {
    if (!elements.pageIndicator) return;
    elements.pageIndicator.textContent = `Page ${pagination.page} of ${pagination.totalPages}`;
    elements.pagePrevBtn.disabled = pagination.page <= 1;
    elements.pageNextBtn.disabled = pagination.page >= pagination.totalPages;
}

// Render Item Cards
function renderItems(items) {
    elements.countBadgePill.textContent = `Showing ${items.length} of ${state.totalItems} ${state.totalItems === 1 ? 'item' : 'items'}`;
    
    if (items.length === 0) {
        elements.cardsGrid.innerHTML = '';
        elements.emptyStateBox.classList.remove('hidden');
        return;
    }

    elements.emptyStateBox.classList.add('hidden');
    elements.cardsGrid.innerHTML = items.map(item => {
        const statusClass = item.status === 'REUNITED' ? 'reunited' : item.type.toLowerCase();
        const statusLabel = item.status === 'REUNITED' ? 'REUNITED' : item.type;
        const fallbackImg = categoryDefaultImages[item.category] || categoryDefaultImages['Other'];
        const displayImg = getSmartItemImage(item);
        
        return `
            <div class="item-card" onclick="openDetailsModal(${item.id})">
                <div class="card-img-wrapper">
                    <img src="${displayImg}" alt="${escapeHtml(item.title)}" onerror="this.src='${fallbackImg}'">
                    <span class="badge-status ${statusClass}">${statusLabel}</span>
                    <span class="badge-cat">${escapeHtml(item.category)}</span>
                </div>
                <div class="card-content">
                    <h3 class="card-item-title">${escapeHtml(item.title)}</h3>
                    <div class="card-location-tag">
                        <i class="fa-solid fa-location-dot"></i> ${escapeHtml(item.location)}
                    </div>
                    <p class="card-description">${escapeHtml(item.description)}</p>
                    <div class="card-bottom-bar">
                        <span class="card-date"><i class="fa-solid fa-calendar-day"></i> ${escapeHtml(item.date_reported)}</span>
                        <button class="btn-view-details">Details <i class="fa-solid fa-arrow-right"></i></button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// View Details Modal
function openDetailsModal(id) {
    const item = state.items.find(i => i.id === id);
    if (!item) return;

    state.currentItemId = id;
    
    const statusClass = item.status === 'REUNITED' ? 'reunited' : item.type.toLowerCase();
    elements.detailTypeBadge.className = `badge-status ${statusClass}`;
    elements.detailTypeBadge.textContent = item.status === 'REUNITED' ? 'REUNITED / CLAIMED' : item.type;
    
    const fallbackImg = categoryDefaultImages[item.category] || categoryDefaultImages['Other'];
    const displayImg = getSmartItemImage(item);

    elements.detailImg.src = displayImg;
    elements.detailImg.onerror = () => { elements.detailImg.src = fallbackImg; };
    
    elements.detailTitle.textContent = item.title;
    elements.detailCategory.textContent = item.category;
    elements.detailLocation.textContent = item.location;
    elements.detailDate.textContent = item.date_reported;
    elements.detailDesc.textContent = item.description;
    elements.detailContactPerson.textContent = item.contact_name;
    elements.detailContactInfo.textContent = item.contact_info;

    elements.btnMarkReunited.style.display = item.status === 'REUNITED' ? 'none' : 'inline-flex';
    
    // Ownership buttons control (Requires being logged in AND matching item owner)
    const isOwner = Boolean(state.user) && (item.user_id === 0 || item.user_id === state.user.id);
    elements.btnOpenEditItem.style.display = isOwner ? 'inline-flex' : 'none';
    elements.btnDeleteItem.style.display = isOwner ? 'inline-flex' : 'none';

    elements.detailsModal.classList.remove('hidden');
}

// Form Submit Handler (Report Item + File Upload)
async function handleReportSubmit(e) {
    e.preventDefault();

    let uploadedImageUrl = document.getElementById('form_image_url').value.trim();

    // Check if user attached a local image file
    if (elements.formImageFile && elements.formImageFile.files.length > 0) {
        const file = elements.formImageFile.files[0];
        const formData = new FormData();
        formData.append('image', file);

        try {
            const uploadRes = await fetch(`${API_BASE_URL}/api/upload`, {
                method: 'POST',
                headers: state.token ? { 
                    'Authorization': `Bearer ${state.token}`,
                    'bypass-tunnel-reminder': 'true'
                } : { 'bypass-tunnel-reminder': 'true' },
                body: formData
            });
            const uploadData = await uploadRes.json();

            if (!uploadRes.ok) throw new Error(uploadData.error || 'Image upload failed');
            uploadedImageUrl = uploadData.url;
        } catch (err) {
            showToast(`Upload Warning: ${err.message}. Using default image.`, 'error');
        }
    }
    
    const payload = {
        type: document.querySelector('input[name="form_type"]:checked').value,
        title: document.getElementById('form_title').value.trim(),
        category: document.getElementById('form_category').value,
        date_reported: document.getElementById('form_date').value,
        location: document.getElementById('form_location').value.trim(),
        description: document.getElementById('form_description').value.trim(),
        contact_name: document.getElementById('form_contact_name').value.trim(),
        contact_info: document.getElementById('form_contact_info').value.trim(),
        image_url: uploadedImageUrl
    };

    const headers = { 
        'Content-Type': 'application/json',
        'bypass-tunnel-reminder': 'true'
    };
    if (state.token) headers['Authorization'] = `Bearer ${state.token}`;

    try {
        const res = await fetch(`${API_BASE_URL}/api/items`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Submission failed');
        
        showToast('Item report published successfully!', 'success');
        elements.reportModal.classList.add('hidden');
        elements.reportForm.reset();
        
        fetchStats();
        fetchItems();

        if (data.id) {
            fetch(`${API_BASE_URL}/api/items/${data.id}/matches`, { headers: { 'bypass-tunnel-reminder': 'true' } })
                .then(r => r.json())
                .then(matchData => {
                    if (matchData.matches && matchData.matches.length > 0) {
                        showToast(`⚡ Smart Match Alert: ${matchData.matches.length} potential matches found!`, 'success');
                        setTimeout(() => openSmartMatchModal(data.id), 800);
                    }
                })
                .catch(() => {});
        }
    } catch (err) {
        showToast(err.message || 'Error publishing report.', 'error');
    }
}

// Open Edit Modal with prefilled data
function openEditModal() {
    const item = state.items.find(i => i.id === state.currentItemId);
    if (!item) return;

    document.getElementById('edit_item_id').value = item.id;
    document.querySelector(`input[name="edit_type"][value="${item.type}"]`).checked = true;
    document.getElementById('edit_title').value = item.title;
    document.getElementById('edit_category').value = item.category;
    document.getElementById('edit_date').value = item.date_reported;
    document.getElementById('edit_location').value = item.location;
    document.getElementById('edit_description').value = item.description;
    document.getElementById('edit_contact_name').value = item.contact_name;
    document.getElementById('edit_contact_info').value = item.contact_info;
    document.getElementById('edit_image_url').value = item.image_url || '';

    elements.detailsModal.classList.add('hidden');
    elements.editModal.classList.remove('hidden');
}

// Edit Submit Handler
async function handleEditSubmit(e) {
    e.preventDefault();
    const itemId = document.getElementById('edit_item_id').value;

    const payload = {
        type: document.querySelector('input[name="edit_type"]:checked').value,
        title: document.getElementById('edit_title').value.trim(),
        category: document.getElementById('edit_category').value,
        date_reported: document.getElementById('edit_date').value,
        location: document.getElementById('edit_location').value.trim(),
        description: document.getElementById('edit_description').value.trim(),
        contact_name: document.getElementById('edit_contact_name').value.trim(),
        contact_info: document.getElementById('edit_contact_info').value.trim(),
        image_url: document.getElementById('edit_image_url').value.trim()
    };

    if (!state.token) {
        return showToast('Please log in to edit listing details.', 'error');
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/items/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`,
                'bypass-tunnel-reminder': 'true'
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Edit failed');

        showToast('Listing details updated successfully!', 'success');
        elements.editModal.classList.add('hidden');
        fetchItems();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// Mark Reunited
async function handleMarkReunited() {
    if (!state.currentItemId) return;

    if (!state.token) {
        elements.detailsModal.classList.add('hidden');
        elements.authModal.classList.remove('hidden');
        return showToast('Please log in first to mark an item as reunited.', 'error');
    }

    const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`,
        'bypass-tunnel-reminder': 'true'
    };

    try {
        const res = await fetch(`${API_BASE_URL}/api/items/${state.currentItemId}/status`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ status: 'REUNITED' })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Status update failed');

        showToast('Item marked as Reunited!', 'success');
        elements.detailsModal.classList.add('hidden');
        
        fetchStats();
        fetchItems();
    } catch (err) {
        showToast(err.message || 'Failed to update status.', 'error');
    }
}

// Delete Item
async function handleDeleteItem() {
    if (!state.currentItemId) return;
    
    if (!state.token) {
        elements.detailsModal.classList.add('hidden');
        elements.authModal.classList.remove('hidden');
        return showToast('Please log in first to delete a listing.', 'error');
    }

    if (!confirm('Are you sure you want to remove this record from the database?')) {
        return;
    }

    const headers = {
        'Authorization': `Bearer ${state.token}`,
        'bypass-tunnel-reminder': 'true'
    };

    try {
        const res = await fetch(`${API_BASE_URL}/api/items/${state.currentItemId}`, {
            method: 'DELETE',
            headers
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Delete failed');

        showToast('Listing deleted successfully.', 'success');
        elements.detailsModal.classList.add('hidden');
        
        fetchStats();
        fetchItems();
    } catch (err) {
        showToast(err.message || 'Failed to delete item.', 'error');
    }
}

// Toast System
function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-msg ${type}`;
    const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(msg)}</span>`;
    
    elements.toastStack.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ==========================================================================
// GENESIS 2.0 SMART MATCH ENGINE FRONTEND LOGIC
// ==========================================================================

async function openSmartMatchModal(targetItemId = null) {
    elements.smartMatchModal.classList.remove('hidden');
    elements.smartMatchResultsContainer.innerHTML = `
        <div class="empty-box">
            <div class="empty-icon-circle"><i class="fa-solid fa-rotate fa-spin"></i></div>
            <h3>Loading database records for matching...</h3>
        </div>
    `;

    try {
        const res = await fetch(`${API_BASE_URL}/api/items?limit=100`, {
            headers: { 'bypass-tunnel-reminder': 'true' }
        });
        const data = await res.json();
        const allItems = data.items || data || [];

        const openItems = allItems.filter(i => i.status !== 'REUNITED');

        if (openItems.length === 0) {
            elements.smartMatchItemSelect.innerHTML = `<option value="">No open items available in database</option>`;
            elements.smartMatchResultsContainer.innerHTML = `
                <div class="empty-box">
                    <div class="empty-icon-circle"><i class="fa-solid fa-folder-open"></i></div>
                    <h3>No items available for Smart Matching</h3>
                    <p style="color: var(--text-muted);">Report a lost or found item first!</p>
                </div>
            `;
            return;
        }

        elements.smartMatchItemSelect.innerHTML = openItems.map(item => `
            <option value="${item.id}" ${targetItemId === item.id ? 'selected' : ''}>
                [${item.type}] ${escapeHtml(item.title)} - ${escapeHtml(item.location)}
            </option>
        `).join('');

        const selectedId = targetItemId || openItems[0].id;
        elements.smartMatchItemSelect.value = selectedId;
        runSmartMatch(selectedId);
    } catch (err) {
        console.error('Error opening Smart Match modal:', err);
        elements.smartMatchResultsContainer.innerHTML = `
            <div class="empty-box">
                <div class="empty-icon-circle"><i class="fa-solid fa-triangle-exclamation" style="color: var(--lost-color);"></i></div>
                <h3>Failed to load item matches</h3>
            </div>
        `;
    }
}

async function runSmartMatch(itemId) {
    elements.smartMatchResultsContainer.innerHTML = `
        <div class="empty-box">
            <div class="empty-icon-circle"><i class="fa-solid fa-bolt fa-spin" style="color: var(--gold-light);"></i></div>
            <h3>Running Smart Match engine...</h3>
            <p style="color: var(--text-muted);">Comparing category, location, title keywords & dates...</p>
        </div>
    `;

    try {
        const res = await fetch(`${API_BASE_URL}/api/items/${itemId}/matches`, {
            headers: { 'bypass-tunnel-reminder': 'true' }
        });
        if (!res.ok) throw new Error('Match query failed');

        const data = await res.json();
        const target = data.target_item;
        const matches = data.matches;

        elements.smartMatchTargetBanner.classList.remove('hidden');
        const statusClass = target.type.toLowerCase();
        elements.matchTargetType.className = `badge-status ${statusClass}`;
        elements.matchTargetType.textContent = target.type;
        elements.matchTargetTitle.textContent = target.title;
        elements.matchTargetMeta.textContent = `${target.category} • ${target.location} • Reported on ${target.date_reported}`;

        if (!matches || matches.length === 0) {
            elements.smartMatchResultsContainer.innerHTML = `
                <div class="empty-box">
                    <div class="empty-icon-circle"><i class="fa-solid fa-shield-xmark" style="color: var(--text-muted);"></i></div>
                    <h3>No Strong Matches Found Yet</h3>
                    <p style="color: var(--text-muted);">No open ${target.type === 'LOST' ? 'FOUND' : 'LOST'} items currently match this description with high confidence.</p>
                </div>
            `;
            return;
        }

        elements.smartMatchResultsContainer.innerHTML = matches.map(m => {
            const cand = m.candidate;
            const score = m.score;
            let scoreLevel = 'low';
            if (score >= 70) scoreLevel = 'high';
            else if (score >= 45) scoreLevel = 'medium';

            const fallbackImg = categoryDefaultImages[cand.category] || categoryDefaultImages['Other'];
            const displayImg = getSmartItemImage(cand);

            const reasonBadges = m.reasons.map(r => `<span class="reason-pill">${escapeHtml(r)}</span>`).join('');

            return `
                <div class="match-card">
                    <div class="match-card-header">
                        <div style="display: flex; gap: 0.8rem; align-items: center;">
                            <img src="${displayImg}" style="width: 54px; height: 54px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border-light);" onerror="this.src='${fallbackImg}'">
                            <div>
                                <span class="badge-status ${cand.type.toLowerCase()}" style="font-size: 0.65rem; padding: 0.15rem 0.4rem;">${cand.type}</span>
                                <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-heading); margin-top: 0.2rem;">${escapeHtml(cand.title)}</h4>
                                <span style="font-size: 0.8rem; color: var(--text-muted);"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(cand.location)} • ${escapeHtml(cand.date_reported)}</span>
                            </div>
                        </div>
                        
                        <div class="match-score-badge">
                            <span class="match-score-num ${scoreLevel}">${score}% Match</span>
                            <div class="match-score-bar-bg">
                                <div class="match-score-bar-fill ${scoreLevel}" style="width: ${score}%;"></div>
                            </div>
                        </div>
                    </div>
                    
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">${escapeHtml(cand.description)}</p>
                    
                    <div class="match-reasons-list">
                        ${reasonBadges}
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.3rem;">
                        <span style="font-size: 0.8rem; color: var(--gold-light); font-weight: 600;">
                            <i class="fa-solid fa-user-check"></i> ${escapeHtml(cand.contact_name)} (${escapeHtml(cand.contact_info)})
                        </span>
                        <button class="btn btn-glass" style="padding: 0.35rem 0.85rem; font-size: 0.8rem;" onclick="openMatchItemDetails(${cand.id})">
                            View & Contact <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('Error running Smart Match:', err);
        elements.smartMatchResultsContainer.innerHTML = `
            <div class="empty-box">
                <div class="empty-icon-circle"><i class="fa-solid fa-triangle-exclamation" style="color: var(--lost-color);"></i></div>
                <h3>Failed to calculate Smart Match scores</h3>
            </div>
        `;
    }
}

function openMatchItemDetails(itemId) {
    elements.smartMatchModal.classList.add('hidden');
    openDetailsModal(itemId);
}

// ==========================================================================
// GENESIS 2.0 PHASE 2 DATA MIGRATION ENGINE & EVIDENCE LOGIC
// ==========================================================================

const sampleMigrationPayload = [
    {
        "title": "Apple MacBook Pro M2 (Space Grey)",
        "type": "LOST",
        "category": "Electronics",
        "location": "Central Library Reading Room 1",
        "date_reported": "2026-09-18",
        "description": "Left in laptop sleeve on desk 4. Stickers on lid: Octocat & Python logo.",
        "contact_name": "Siddharth Verma",
        "contact_info": "sid.verma@campus.edu | Ph: 9812345678"
    },
    {
        "title": "Blue HP Laptop Backpack",
        "type": "FOUND",
        "category": "Apparel",
        "location": "CS Department Seminar Hall",
        "date_reported": "2026-09-18",
        "description": "Found after CSE guest lecture. Contains 2 notebooks and blue pen.",
        "contact_name": "Volunteer Desk",
        "contact_info": "volunteers@campus.edu"
    },
    {
        "title": "Wireless Boat Airdopes (Black)",
        "type": "LOST",
        "category": "Electronics",
        "location": "Central Library Reading Room 2",
        "date_reported": "2026-09-15",
        "description": "Duplicate item check - already reported in database.",
        "contact_name": "Rahul Sharma",
        "contact_info": "rahul.cs23@campus.edu"
    },
    {
        "title": "College ID Card & Leather Wallet",
        "type": "LOST",
        "category": "ID & Wallet",
        "location": "Main Canteen Counter",
        "date_reported": "2026-09-16",
        "description": "Duplicate item check - already reported in database.",
        "contact_name": "Ananya Verma",
        "contact_info": "ananya.v@campus.edu"
    },
    {
        "title": "Broken Stainless Steel Flask",
        "type": "FOUND",
        "category": "Other",
        "location": "Sports Complex",
        "date_reported": "2026-09-18",
        "description": "Invalid Record - Missing contact info details.",
        "contact_name": "Anonymous",
        "contact_info": ""
    },
    {
        "title": "Corrupted Record Item",
        "type": "INVALID_TYPE",
        "category": "NonExistentCategory",
        "location": "Canteen",
        "date_reported": "2026-99-99",
        "description": "Corrupted date and category.",
        "contact_name": "Test User",
        "contact_info": "invalid_contact"
    }
];

let migrationStateData = null;

function openMigrationModal() {
    elements.migrationModal.classList.remove('hidden');
    if (!elements.migrationRawInput.value.trim()) {
        loadSampleMigrationDataset();
    }
}

function loadSampleMigrationDataset() {
    elements.migrationRawInput.value = JSON.stringify(sampleMigrationPayload, null, 2);
    showToast('Sample dataset loaded with mixed valid, duplicate, and invalid entries!', 'success');
}

async function runDataMigrationPipeline() {
    const rawTxt = elements.migrationRawInput.value.trim();
    if (!rawTxt) {
        return showToast('Please provide a raw JSON dataset to migrate.', 'error');
    }

    let parsedRecords = [];
    try {
        parsedRecords = JSON.parse(rawTxt);
    } catch (err) {
        return showToast('Invalid JSON format. Please format as a valid JSON array.', 'error');
    }

    elements.btnRunMigration.disabled = true;
    elements.btnRunMigration.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;

    try {
        const headers = { 
            'Content-Type': 'application/json',
            'bypass-tunnel-reminder': 'true'
        };
        if (state.token) headers['Authorization'] = `Bearer ${state.token}`;

        const res = await fetch(`${API_BASE_URL}/api/migration/import`, {
            method: 'POST',
            headers,
            body: JSON.stringify(parsedRecords)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Migration failed');

        migrationStateData = data;
        const summary = data.summary;

        // Update Stat Badges
        elements.migStatRaw.textContent = summary.total_raw;
        elements.migStatImported.textContent = summary.imported_count;
        elements.migStatDuplicate.textContent = summary.duplicate_count;
        elements.migStatRejected.textContent = summary.rejected_count;
        elements.migStatSuccessRate.textContent = summary.success_rate;

        elements.migrationDashboard.classList.remove('hidden');

        // Render default evidence tab (imported)
        renderMigrationEvidenceTab('imported');

        showToast(`Migration Complete! ${summary.imported_count} imported, ${summary.duplicate_count} duplicates, ${summary.rejected_count} rejected.`, 'success');

        // Refresh stats & items list
        fetchStats();
        fetchItems();
    } catch (err) {
        showToast(err.message || 'Error running migration pipeline.', 'error');
    } finally {
        elements.btnRunMigration.disabled = false;
        elements.btnRunMigration.innerHTML = `<i class="fa-solid fa-play"></i> Run Migration Pipeline`;
    }
}

function renderMigrationEvidenceTab(tabKey) {
    if (!migrationStateData) return;

    const container = elements.migEvidenceContainer;

    if (tabKey === 'imported') {
        const records = migrationStateData.imported_records;
        if (!records || records.length === 0) {
            container.innerHTML = `<p class="text-muted">No records were imported in this batch.</p>`;
            return;
        }
        container.innerHTML = `
            <table class="mig-table">
                <thead>
                    <tr><th>ID</th><th>Type</th><th>Title</th><th>Category</th><th>Location</th><th>Contact</th></tr>
                </thead>
                <tbody>
                    ${records.map(r => `
                        <tr>
                            <td>#${r.id}</td>
                            <td><span class="badge-status ${r.type.toLowerCase()}" style="font-size:0.65rem; padding:0.15rem 0.4rem;">${r.type}</span></td>
                            <td><strong>${escapeHtml(r.title)}</strong></td>
                            <td>${escapeHtml(r.category)}</td>
                            <td>${escapeHtml(r.location)}</td>
                            <td>${escapeHtml(r.contact_name)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else if (tabKey === 'duplicates') {
        const records = migrationStateData.duplicate_records;
        if (!records || records.length === 0) {
            container.innerHTML = `<p class="text-muted">No duplicate records detected.</p>`;
            return;
        }
        container.innerHTML = `
            <table class="mig-table">
                <thead>
                    <tr><th>Type</th><th>Title</th><th>Location</th><th>Status Log</th></tr>
                </thead>
                <tbody>
                    ${records.map(d => `
                        <tr>
                            <td><span class="badge-status ${d.record.type ? d.record.type.toLowerCase() : 'lost'}" style="font-size:0.65rem; padding:0.15rem 0.4rem;">${escapeHtml(d.record.type || 'N/A')}</span></td>
                            <td><strong>${escapeHtml(d.record.title)}</strong></td>
                            <td>${escapeHtml(d.record.location)}</td>
                            <td><span class="reason-pill" style="color:#f59e0b; border-color:rgba(245,158,11,0.3);">${escapeHtml(d.reason)}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else if (tabKey === 'rejected') {
        const records = migrationStateData.rejected_records;
        if (!records || records.length === 0) {
            container.innerHTML = `<p class="text-muted">No invalid records rejected.</p>`;
            return;
        }
        container.innerHTML = `
            <table class="mig-table">
                <thead>
                    <tr><th>Raw Title / Payload</th><th>Rejection Reasons</th></tr>
                </thead>
                <tbody>
                    ${records.map(rj => `
                        <tr>
                            <td><strong>${escapeHtml(rj.record.title || 'Untitled Record')}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(JSON.stringify(rj.record))}</span></td>
                            <td>${rj.reasons.map(reason => `<span class="rej-reason-tag">${escapeHtml(reason)}</span>`).join('')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else if (tabKey === 'raw') {
        container.innerHTML = `<pre style="font-family:monospace; font-size:0.75rem; color:var(--text-muted); margin:0;">${escapeHtml(JSON.stringify(migrationStateData.raw_records, null, 2))}</pre>`;
    }
}
