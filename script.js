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
    },
    selectedTemplate: 'classic'
};

const STORAGE_KEY = 'resumeBuilderData';
const TEMPLATE_KEY = 'resumeBuilderTemplate';

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.resume));
    localStorage.setItem(TEMPLATE_KEY, state.selectedTemplate);
}

function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        state.resume = JSON.parse(saved);
        syncInputsFromState();
    }
    const savedTemplate = localStorage.getItem(TEMPLATE_KEY);
    if (savedTemplate) {
        state.selectedTemplate = savedTemplate;
    }
}

function syncInputsFromState() {
    document.querySelectorAll('[data-field]').forEach(input => {
        const field = input.getAttribute('data-field');
        if (field.startsWith('personal.')) {
            const subfield = field.split('.')[1];
            input.value = state.resume.personal[subfield] || '';
        } else {
            input.value = state.resume[field] || '';
        }
    });
}

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
        if (activeRoute === 'builder') {
            renderFormEntries('experience');
            renderFormEntries('education');
            renderFormEntries('projects');
            renderATSScore();
        }
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

            saveState();
            renderResume();
            renderATSScore();
        });
    });
}

// --- RENDERING ---
function renderResume() {
    const mini = document.getElementById('mini-preview');
    const full = document.getElementById('full-preview');

    // Update template classes on parents
    if (mini) mini.parentElement.className = `preview-panel template-${state.selectedTemplate}`;
    if (full) full.parentElement.className = `page active template-${state.selectedTemplate}`;

    const html = generateResumeHTML();

    if (mini) mini.innerHTML = html;
    if (full) full.innerHTML = html;

    // Run validation silently on render
    validateBeforeExport();

    // Update active tab UI
    document.querySelectorAll('.template-tab').forEach(tab => {
        const template = tab.getAttribute('onclick').match(/'([^']+)'/)[1];
        tab.classList.toggle('active', template === state.selectedTemplate);
    });
}

function generateResumeHTML() {
    const p = state.resume.personal;
    const skills = state.resume.skills.split(',').map(s => s.trim()).filter(s => s);
    const template = state.selectedTemplate;

    if (template === 'modern') {
        return `
            <div class="res-header">
                <div class="res-name">${p.name || 'Your Name'}</div>
                <div class="res-contact">
                    ${p.email || 'email@example.com'} | ${p.phone || '+91 00000 00000'} | ${p.location || 'Location'}
                </div>
            </div>
            <div class="res-sidebar">
                <div class="res-section">
                    <div class="res-section-title">Contact</div>
                    <div class="res-item-desc">
                        ${p.github ? `GitHub: ${p.github}<br>` : ''}
                        ${p.linkedin ? `LinkedIn: ${p.linkedin}` : ''}
                    </div>
                </div>
                ${skills.length > 0 ? `
                <div class="res-section">
                    <div class="res-section-title">Skills</div>
                    <div class="res-skills">${skills.join('<br>')}</div>
                </div>
                ` : ''}
            </div>
            <div class="res-main">
                ${p.summary ? `
                <div class="res-section">
                    <div class="res-section-title">Summary</div>
                    <p class="res-item-desc">${p.summary}</p>
                </div>
                ` : ''}
                ${state.resume.education.length > 0 ? `
                <div class="res-section">
                    <div class="res-section-title">Education</div>
                    ${state.resume.education.map(edu => `
                        <div class="res-item">
                            <div class="res-item-header"><span>${edu.degree || 'Degree'}</span></div>
                            <div class="res-item-sub">${edu.school || 'University'} | ${edu.year || '2020'}</div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                ${state.resume.experience.length > 0 ? `
                <div class="res-section">
                    <div class="res-section-title">Experience</div>
                    ${state.resume.experience.map(exp => `
                        <div class="res-item">
                            <div class="res-item-header"><span>${exp.role || 'Role'}</span></div>
                            <div class="res-item-sub">${exp.company} | ${exp.duration}</div>
                            <div class="res-item-desc">${exp.desc}</div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
            </div>
        `;
    }

    // Classic / Minimal logic (shared mostly)
    let html = `
        <div class="res-header">
            <div class="res-name">${p.name || 'Your Name'}</div>
            <div class="res-contact">
                ${p.email || 'email@example.com'} | ${p.phone || '+91 00000 00000'} | ${p.location || 'Location'}
                <br>
                ${p.github ? `GitHub: ${p.github} | ` : ''} ${p.linkedin ? `LinkedIn: ${p.linkedin}` : ''}
            </div>
        </div>
    `;

    // Summary
    if (p.summary) {
        html += `<div class="res-section"><div class="res-section-title">Summary</div><p class="res-item-desc">${p.summary}</p></div>`;
    }

    // Education
    if (state.resume.education.length > 0) {
        html += `<div class="res-section"><div class="res-section-title">Education</div>${state.resume.education.map(edu => `
            <div class="res-item"><div class="res-item-header"><span>${edu.degree || 'Degree'}</span><span>${edu.year || '2020'}</span></div><div class="res-item-sub">${edu.school || 'University'}</div></div>
        `).join('')}</div>`;
    }

    // Experience
    if (state.resume.experience.length > 0) {
        html += `<div class="res-section"><div class="res-section-title">Experience</div>${state.resume.experience.map(exp => `
            <div class="res-item"><div class="res-item-header"><span>${exp.role || 'Role'}</span><span>${exp.duration || '2022 - Present'}</span></div><div class="res-item-sub">${exp.company || 'Company'}</div><div class="res-item-desc">${exp.desc || ''}</div></div>
        `).join('')}</div>`;
    }

    // Projects
    if (state.resume.projects.length > 0) {
        html += `<div class="res-section"><div class="res-section-title">Projects</div>${state.resume.projects.map(proj => `
            <div class="res-item"><div class="res-item-header"><span>${proj.title || 'Project Title'}</span><span>${proj.link || ''}</span></div><div class="res-item-desc">${proj.desc || ''}</div></div>
        `).join('')}</div>`;
    }

    // Skills
    if (skills.length > 0) {
        html += `<div class="res-section"><div class="res-section-title">Skills</div><div class="res-skills">${skills.join(' • ')}</div></div>`;
    }

    // Links
    if (p.github || p.linkedin) {
        html += `<div class="res-section"><div class="res-section-title">Links</div><div class="res-item-desc">${p.github ? `<strong>GitHub:</strong> ${p.github}<br>` : ''}${p.linkedin ? `<strong>LinkedIn:</strong> ${p.linkedin}` : ''}</div></div>`;
    }

    return html;
}

function switchTemplate(template) {
    state.selectedTemplate = template;
    saveState();
    renderResume();
}

// --- EXPORT & VALIDATION ---
function validateBeforeExport() {
    const p = state.resume.personal;
    const warning = document.getElementById('validation-warning');

    const hasName = p.name && p.name.trim().length > 0;
    const hasExpOrProj = state.resume.experience.length > 0 || state.resume.projects.length > 0;

    if (warning) {
        if (!hasName || !hasExpOrProj) {
            warning.style.display = 'flex';
        } else {
            warning.style.display = 'none';
        }
    }
    return { hasName, hasExpOrProj };
}

function exportToPDF() {
    validateBeforeExport();
    window.print();
}

function copyAsText() {
    validateBeforeExport();
    const r = state.resume;
    const p = r.personal;

    let text = `${p.name || 'Your Name'}\n`;
    text += `${p.email || 'email@example.com'} | ${p.phone || '+91 00000 00000'} | ${p.location || 'Location'}\n`;
    if (p.github) text += `GitHub: ${p.github}\n`;
    if (p.linkedin) text += `LinkedIn: ${p.linkedin}\n`;
    text += `\nSUMMARY\n${p.summary || 'Summary not provided'}\n`;

    if (r.education.length > 0) {
        text += `\nEDUCATION\n`;
        r.education.forEach(edu => {
            text += `${edu.degree} | ${edu.school} | ${edu.year}\n`;
        });
    }

    if (r.experience.length > 0) {
        text += `\nEXPERIENCE\n`;
        r.experience.forEach(exp => {
            text += `${exp.role} | ${exp.company} | ${exp.duration}\n${exp.desc}\n`;
        });
    }

    if (r.projects.length > 0) {
        text += `\nPROJECTS\n`;
        r.projects.forEach(proj => {
            text += `${proj.title} | ${proj.link}\n${proj.desc}\n`;
        });
    }

    if (r.skills) {
        text += `\nSKILLS\n${r.skills}\n`;
    }

    navigator.clipboard.writeText(text).then(() => {
        alert('Resume copied to clipboard as plain text!');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

// --- ATS SCORING & IMPROVEMENTS ---
function calculateATSScore() {
    let score = 0;
    const improvements = [];
    const resume = state.resume;
    const p = resume.personal;

    // 1. Summary length (40-120 words)
    const summaryWords = p.summary ? p.summary.split(/\s+/).filter(w => w).length : 0;
    if (summaryWords >= 40 && summaryWords <= 120) {
        score += 15;
    } else {
        if (summaryWords < 40) improvements.push("Write a stronger summary (40–120 words).");
    }

    // 2. At least 2 projects
    if (resume.projects.length >= 2) {
        score += 10;
    } else {
        improvements.push("Add at least 2 projects.");
    }

    // 3. At least 1 experience entry
    if (resume.experience.length >= 1) {
        score += 10;
    } else {
        improvements.push("Add internship or project work experience.");
    }

    // 4. Skills list has >= 8 items
    const skills = resume.skills ? resume.skills.split(',').map(s => s.trim()).filter(s => s) : [];
    if (skills.length >= 8) {
        score += 10;
    } else {
        improvements.push("Add more skills (target 8+).");
    }

    // 5. GitHub or LinkedIn exists
    if (p.github || p.linkedin) {
        score += 10;
    }

    // 6. Measurable impact (numbers) in experience or project bullets
    const hasNumbers = (entry) => {
        const text = (entry.desc || '').toLowerCase();
        return /[0-9]/.test(text);
    };
    const anyNumbers = [...resume.experience, ...resume.projects].some(hasNumbers);
    if (anyNumbers) {
        score += 15;
    } else {
        improvements.push("Add measurable impact (numbers) in bullets.");
    }

    // 7. Education complete
    const eduComplete = resume.education.length > 0 && resume.education.every(e => e.school && e.degree && e.year);
    if (eduComplete) {
        score += 10;
    }

    score = Math.min(100, score);
    return { score, suggestions: improvements.slice(0, 3) };
}

function renderATSScore() {
    const { score, suggestions } = calculateATSScore();
    const scoreVal = document.getElementById('ats-score-value');
    const meterFill = document.getElementById('ats-meter-fill');
    const suggestionsList = document.getElementById('ats-suggestions');

    if (scoreVal) scoreVal.innerText = score;
    if (meterFill) meterFill.style.width = `${score}%`;

    if (suggestionsList) {
        suggestionsList.innerHTML = suggestions.map(s => `<div class="suggestion-item">${s}</div>`).join('');
    }
}

// --- DYNAMIC LISTS ---
function addEntry(type) {
    const entry = {};
    if (type === 'experience') {
        entry.company = '';
        entry.role = '';
        entry.duration = '';
        entry.desc = '';
    } else if (type === 'education') {
        entry.school = '';
        entry.degree = '';
        entry.year = '';
    } else if (type === 'projects') {
        entry.title = '';
        entry.desc = '';
        entry.link = '';
    }

    state.resume[type].push(entry);
    saveState();
    renderFormEntries(type);
    renderResume();
    renderATSScore();
}

function removeEntry(type, index) {
    state.resume[type].splice(index, 1);
    saveState();
    renderFormEntries(type);
    renderResume();
    renderATSScore();
}

function renderFormEntries(type) {
    const list = document.getElementById(`${type}-form-list`);
    if (!list) return;

    list.innerHTML = state.resume[type].map((entry, i) => {
        const fields = Object.keys(entry);
        return `
        <div class="entry-list-item">
            <div style="display: flex; justify-content: flex-end;">
                <button onclick="removeEntry('${type}', ${i})" style="background: none; border: none; font-size: 10px; color: red; cursor: pointer;">Remove</button>
            </div>
            ${fields.map(key => {
            let guidance = '';
            if (key === 'desc' && (type === 'experience' || type === 'projects')) {
                const val = entry[key] || '';
                const actionVerbs = ['built', 'developed', 'designed', 'implemented', 'led', 'improved', 'created', 'optimized', 'automated'];
                const hasActionVerb = actionVerbs.some(v => val.toLowerCase().startsWith(v));
                const hasNumbers = /[0-9]/.test(val);

                if (val && !hasActionVerb) guidance += `<div class="guidance-hint">Start with a strong action verb.</div>`;
                if (val && !hasNumbers) guidance += `<div class="guidance-hint">Add measurable impact (numbers).</div>`;
            }

            return `
                <div class="form-group">
                    <label class="input-label">${key}</label>
                    <input type="text" class="form-control" value="${entry[key]}" oninput="updateEntry('${type}', ${i}, '${key}', this.value)">
                    ${guidance}
                </div>
                `;
        }).join('')}
        </div>
    `}).join('');
}

function updateEntry(type, index, key, value) {
    state.resume[type][index][key] = value;
    saveState();
    renderResume();
    renderATSScore();
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
        projects: [
            { title: 'AI Build Tracker', link: 'github.com/zain/ai-build', desc: 'A real-time project management tool with AI artifact verification.' }
        ],
        skills: 'JavaScript, React, Tailwind CSS, Node.js, Git, Figma'
    };

    saveState();
    syncInputsFromState();
    renderFormEntries('experience');
    renderFormEntries('education');
    renderFormEntries('projects');
    renderResume();
    renderATSScore();
}

// --- INIT ---
window.addEventListener('hashchange', handleRouting);
window.addEventListener('DOMContentLoaded', () => {
    loadState();
    handleRouting();
    initFormSync();
    renderResume();
    renderATSScore();
});
