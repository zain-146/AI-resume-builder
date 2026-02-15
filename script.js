/**
 * AI Resume Builder - Core logic
 */

const state = {
    resume: {
        personal: {
            name: '',
            email: '',
            phone: '',
            location: '',
            summary: '',
            github: '',
            linkedin: ''
        },
        experience: [],
        education: [],
        projects: [],
        skills: ''
    }
};

// --- ROUTING ---
function handleRouting() {
    const hash = window.location.hash || '#/';
    const activeRoute = hash === '#/' ? 'home' : hash.replace('#/', '');

    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

    const activePage = document.getElementById(`page-${activeRoute}`);
    if (activePage) activePage.classList.add('active');

    const activeLink = document.querySelector(`.nav-link[data-route="${activeRoute}"]`);
    if (activeLink) activeLink.classList.add('active');

    if (activeRoute === 'builder' || activeRoute === 'preview') {
        renderResume();
    }
}

// --- FORM SYNC ---
function initFormSync() {
    document.querySelectorAll('[data-field]').forEach(input => {
        input.addEventListener('input', (e) => {
            const field = e.target.getAttribute('data-field');
            const value = e.target.value;
            
            // Handle personal context
            if (field.startsWith('personal.')) {
                const subfield = field.split('.')[1];
                state.resume.personal[subfield] = value;
            } else {
                state.resume[field] = value;
            }
            
            renderResume();
        });
    });
}

// --- RENDERING ---
function renderResume() {
    const mini = document.getElementById('mini-preview');
    const full = document.getElementById('full-preview');
    
    const html = generateResumeHTML();
    
    if (mini) mini.innerHTML = html;
    if (full) full.innerHTML = html;
}

function generateResumeHTML() {
    const p = state.resume.personal;
    const skills = state.resume.skills.split(',').map(s => s.trim()).filter(s => s);
    
    return `
        <div class="res-header">
            <div class="res-name">${p.name || 'Your Name'}</div>
            <div class="res-contact">
                ${p.email || 'email@example.com'} | ${p.phone || '+91 00000 00000'} | ${p.location || 'Location'}
                <br>
                ${p.github ? `GitHub: ${p.github} | ` : ''} ${p.linkedin ? `LinkedIn: ${p.linkedin}` : ''}
            </div>
        </div>

        <div class="res-section">
            <div class="res-section-title">Summary</div>
            <p class="res-item-desc">${p.summary || 'Professionally engineered summary of your expertise and career goals.'}</p>
        </div>

        <div class="res-section">
            <div class="res-section-title">Experience</div>
            ${state.resume.experience.length > 0 ? state.resume.experience.map(exp => `
                <div class="res-item">
                    <div class="res-item-header">
                        <span>${exp.role}</span>
                        <span>${exp.duration}</span>
                    </div>
                    <div class="res-item-sub">${exp.company}</div>
                    <div class="res-item-desc">${exp.desc}</div>
                </div>
            `).join('') : '<p class="res-item-desc">Software Engineer at Tech Corp (2022 - Present)...</p>'}
        </div>

        <div class="res-section">
            <div class="res-section-title">Education</div>
            ${state.resume.education.length > 0 ? state.resume.education.map(edu => `
                <div class="res-item">
                    <div class="res-item-header">
                        <span>${edu.degree}</span>
                        <span>${edu.year}</span>
                    </div>
                    <div class="res-item-sub">${edu.school}</div>
                </div>
            `).join('') : '<p class="res-item-desc">B.Tech in Computer Science, NIT Karnataka (2020)</p>'}
        </div>

        <div class="res-section">
            <div class="res-section-title">Skills</div>
            <div class="res-skills">
                ${skills.length > 0 ? skills.join(' • ') : 'React • Node.js • TypeScript • Cloud Computing'}
            </div>
        </div>
    `;
}

// --- ACTIONS ---
function loadSampleData() {
    state.resume = {
        personal: {
            name: 'Zain Ul Abideen',
            email: 'zain@example.com',
            phone: '+91 91234 56789',
            location: 'Mumbai, India',
            summary: 'Ambitious Software Engineer with a passion for building premium user experiences and highly scalable frontend architectures. Expert in React and modern UI/UX design patterns.',
            github: 'github.com/zain-146',
            linkedin: 'linkedin.com/in/zain'
        },
        experience: [
            { company: 'KodNest Tech', role: 'Full Stack Developer', duration: '2023 - Present', desc: 'Leading the development of premium build systems and SaaS dashboards.' }
        ],
        education: [
            { school: 'Indian Institute of Technology', degree: 'B.Tech Computer Science', year: '2023' }
        ],
        projects: [],
        skills: 'JavaScript, React, Tailwind CSS, Node.js, Git, Figma'
    };

    // Update form fields
    document.querySelectorAll('[data-field]').forEach(input => {
        const field = input.getAttribute('data-field');
        if (field.startsWith('personal.')) {
            const subfield = field.split('.')[1];
            input.value = state.resume.personal[subfield];
        } else {
            input.value = state.resume[field];
        }
    });

    renderResume();
}

// --- INIT ---
window.addEventListener('hashchange', handleRouting);
window.addEventListener('DOMContentLoaded', () => {
    handleRouting();
    initFormSync();
    renderResume();
});
