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
        skills: {
            technical: [],
            soft: [],
            tools: []
        }
    },
    selectedTemplate: 'classic',
    selectedColor: 'hsl(168, 60%, 40%)',
    activeProjectIndex: null
};

const STORAGE_KEY = 'resumeBuilderData';
const TEMPLATE_KEY = 'resumeBuilderTemplate';
const COLOR_KEY = 'resumeBuilderColor';

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.resume));
    localStorage.setItem(TEMPLATE_KEY, state.selectedTemplate);
    localStorage.setItem(COLOR_KEY, state.selectedColor);
}

function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        let loaded = JSON.parse(saved);
        // Migration/Initialization for new structures
        if (typeof loaded.skills === 'string') {
            loaded.skills = { technical: loaded.skills.split(',').map(s => s.trim()).filter(s => s), soft: [], tools: [] };
        }
        if (loaded.projects.length > 0 && typeof loaded.projects[0].techStack === 'undefined') {
            loaded.projects = loaded.projects.map(p => ({
                title: p.title || '',
                desc: p.desc || '',
                techStack: [],
                liveUrl: '',
                githubUrl: ''
            }));
        }
        state.resume = loaded;
        syncInputsFromState();
    }
    const savedTemplate = localStorage.getItem(TEMPLATE_KEY);
    if (savedTemplate) {
        state.selectedTemplate = savedTemplate;
    }
    const savedColor = localStorage.getItem(COLOR_KEY);
    if (savedColor) {
        state.selectedColor = savedColor;
    }
}

function syncInputsFromState() {
    document.querySelectorAll('[data-field]').forEach(input => {
        const field = input.getAttribute('data-field');
        if (field.startsWith('personal.')) {
            const subfield = field.split('.')[1];
            input.value = state.resume.personal[subfield] || '';
        }
    });
    renderSkillsTags();
    renderProjectsForm();
    renderFormEntries('experience');
    renderFormEntries('education');
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
    if (full) {
        const fullParent = full.parentElement;
        fullParent.className = `page active template-${state.selectedTemplate}`;
    }

    // Apply color to CSS Variable
    document.documentElement.style.setProperty('--resume-accent-color', state.selectedColor);

    const html = generateResumeHTML();

    if (mini) mini.innerHTML = html;
    if (full) full.innerHTML = html;

    // Run validation silently on render
    validateBeforeExport();

    // Update active picker UI
    document.querySelectorAll('.template-card').forEach(card => {
        const template = card.getAttribute('data-template');
        card.classList.toggle('active', template === state.selectedTemplate);
    });

    document.querySelectorAll('.color-circle').forEach(circle => {
        const color = circle.getAttribute('data-color');
        circle.classList.toggle('active', color === state.selectedColor);
    });
}

function generateResumeHTML() {
    const p = state.resume.personal;
    const skills = state.resume.skills;
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
                ${renderSkillsPreviewHTML(skills)}
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
                ${renderProjectsPreviewHTML()}
            </div>
        `;
    }

    // Classic / Minimal logic
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

    if (p.summary) html += `<div class="res-section"><div class="res-section-title">Summary</div><p class="res-item-desc">${p.summary}</p></div>`;

    if (state.resume.education.length > 0) {
        html += `<div class="res-section"><div class="res-section-title">Education</div>${state.resume.education.map(edu => `
            <div class="res-item"><div class="res-item-header"><span>${edu.degree || 'Degree'}</span><span>${edu.year || '2020'}</span></div><div class="res-item-sub">${edu.school || 'University'}</div></div>
        `).join('')}</div>`;
    }

    if (state.resume.experience.length > 0) {
        html += `<div class="res-section"><div class="res-section-title">Experience</div>${state.resume.experience.map(exp => `
            <div class="res-item"><div class="res-item-header"><span>${exp.role || 'Role'}</span><span>${exp.duration || '2022 - Present'}</span></div><div class="res-item-sub">${exp.company || 'Company'}</div><div class="res-item-desc">${exp.desc || ''}</div></div>
        `).join('')}</div>`;
    }

    html += renderProjectsPreviewHTML();
    html += renderSkillsPreviewHTML(skills);

    if (p.github || p.linkedin) {
        html += `<div class="res-section"><div class="res-section-title">Links</div><div class="res-item-desc">${p.github ? `<strong>GitHub:</strong> ${p.github}<br>` : ''}${p.linkedin ? `<strong>LinkedIn:</strong> ${p.linkedin}` : ''}</div></div>`;
    }

    return html;
}

function renderSkillsPreviewHTML(skills) {
    let html = '<div class="res-section"><div class="res-section-title">Skills</div>';

    if (skills.technical.length > 0) {
        html += `<div class="res-skills-group"><div class="res-skills-label">Technical</div><div class="res-skills">${skills.technical.join(' • ')}</div></div>`;
    }
    if (skills.soft.length > 0) {
        html += `<div class="res-skills-group"><div class="res-skills-label">Soft Skills</div><div class="res-skills">${skills.soft.join(' • ')}</div></div>`;
    }
    if (skills.tools.length > 0) {
        html += `<div class="res-skills-group"><div class="res-skills-label">Tools</div><div class="res-skills">${skills.tools.join(' • ')}</div></div>`;
    }

    html += '</div>';
    return (skills.technical.length || skills.soft.length || skills.tools.length) ? html : '';
}

function renderProjectsPreviewHTML() {
    if (state.resume.projects.length === 0) return '';
    return `
        <div class="res-section">
            <div class="res-section-title">Projects</div>
            ${state.resume.projects.map(proj => `
                <div class="res-item">
                    <div class="res-item-header">
                        <span style="font-weight: 700;">${proj.title || 'Project Title'}</span>
                        <div class="res-proj-links" style="display:inline-flex; gap:8px; margin-left:12px;">
                            ${proj.githubUrl ? `<a href="${proj.githubUrl}" target="_blank" title="GitHub"><i class="fab fa-github"></i></a>` : ''}
                            ${proj.liveUrl ? `<a href="${proj.liveUrl}" target="_blank" title="Live"><i class="fas fa-external-link-alt"></i></a>` : ''}
                        </div>
                    </div>
                    <div class="res-item-desc">${proj.desc || ''}</div>
                    ${proj.techStack && proj.techStack.length > 0 ? `
                        <div class="res-proj-tech" style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px;">
                            ${proj.techStack.map(t => `<span class="res-item-tag" style="font-size:10px; background:#f0f0f0; padding:2px 6px; border-radius:4px;">${t}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

function switchTemplate(template) {
    state.selectedTemplate = template;
    saveState();
    renderResume();
}

function switchColor(color) {
    state.selectedColor = color;
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

function showToast(message) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.innerText = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

function exportToPDF() {
    validateBeforeExport();
    showToast("PDF export ready! Check your downloads.");
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

// --- SKILLS LOGIC ---
function handleSkillInput(event, category) {
    if (event.key === 'Enter' && event.target.value.trim()) {
        addSkill(category, event.target.value.trim());
        event.target.value = '';
    }
}

function addSkill(category, name) {
    if (!state.resume.skills[category].includes(name)) {
        state.resume.skills[category].push(name);
        saveState();
        renderSkillsTags();
        renderResume();
        renderATSScore();
    }
}

function removeSkill(category, index) {
    state.resume.skills[category].splice(index, 1);
    saveState();
    renderSkillsTags();
    renderResume();
    renderATSScore();
}

function renderSkillsTags() {
    const categories = ['technical', 'soft', 'tools'];
    categories.forEach(cat => {
        const container = document.getElementById(`${cat}-skills-tags`);
        const catLabelId = cat === 'technical' ? 'tech' : cat === 'soft' ? 'soft' : 'tools';
        const label = document.getElementById(`label-${catLabelId}-skills`);
        if (!container) return;

        const skills = state.resume.skills[cat] || [];
        const labelNames = { technical: 'Technical Skills', soft: 'Soft Skills', tools: 'Tools & Technologies' };
        if (label) label.innerText = `${labelNames[cat]} (${skills.length})`;

        container.innerHTML = skills.map((s, i) => `
            <div class="tag-chip">
                ${s}
                <button onclick="removeSkill('${cat}', ${i})">&times;</button>
            </div>
        `).join('');
    });
}

function suggestSkills(btn) {
    btn.classList.add('loading');
    btn.innerText = "Suggesting...";

    setTimeout(() => {
        const suggestions = {
            technical: ["TypeScript", "React", "Node.js", "PostgreSQL", "GraphQL"],
            soft: ["Team Leadership", "Problem Solving"],
            tools: ["Git", "Docker", "AWS"]
        };

        Object.keys(suggestions).forEach(cat => {
            suggestions[cat].forEach(s => {
                if (!state.resume.skills[cat].includes(s)) {
                    state.resume.skills[cat].push(s);
                }
            });
        });

        saveState();
        renderSkillsTags();
        renderResume();
        renderATSScore();

        btn.classList.remove('loading');
        btn.innerText = "✨ Suggest Skills";
    }, 1000);
}

// --- PROJECTS LOGIC ---
function addProjectEntry() {
    state.resume.projects.push({
        title: '',
        desc: '',
        techStack: [],
        liveUrl: '',
        githubUrl: ''
    });
    state.activeProjectIndex = state.resume.projects.length - 1;
    saveState();
    renderProjectsForm();
    renderResume();
}

function toggleProjectAccordion(index) {
    state.activeProjectIndex = state.activeProjectIndex === index ? null : index;
    renderProjectsForm();
}

function updateProjectField(index, field, value) {
    state.resume.projects[index][field] = value;
    saveState();
    renderResume();
    renderATSScore();
}

function handleProjectTechInput(event, index) {
    if (event.key === 'Enter' && event.target.value.trim()) {
        const tech = event.target.value.trim();
        if (!state.resume.projects[index].techStack.includes(tech)) {
            state.resume.projects[index].techStack.push(tech);
            saveState();
            renderProjectsForm();
            renderResume();
        }
        event.target.value = '';
    }
}

function removeProjectTech(pIndex, tIndex) {
    state.resume.projects[pIndex].techStack.splice(tIndex, 1);
    saveState();
    renderProjectsForm();
    renderResume();
}

function removeProjectEntry(index, event) {
    if (event) event.stopPropagation();
    state.resume.projects.splice(index, 1);
    if (state.activeProjectIndex === index) state.activeProjectIndex = null;
    saveState();
    renderProjectsForm();
    renderResume();
    renderATSScore();
}

function renderProjectsForm() {
    const list = document.getElementById('projects-form-list');
    if (!list) return;

    list.innerHTML = state.resume.projects.map((proj, i) => `
        <div class="accordion-item ${state.activeProjectIndex === i ? 'active' : ''}">
            <div class="accordion-header" onclick="toggleProjectAccordion(${i})">
                <span>${proj.title || 'New Project'}</span>
                <div style="display:flex; gap:12px; align-items:center;">
                    <i class="fas fa-chevron-down" style="font-size:10px;"></i>
                    <button onclick="removeProjectEntry(${i}, event)" style="background:none; border:none; color:red; cursor:pointer; font-size:10px;">Delete</button>
                </div>
            </div>
            <div class="accordion-content">
                <div class="form-group">
                    <label class="input-label">Project Title</label>
                    <input type="text" class="form-control" value="${proj.title}" oninput="updateProjectField(${i}, 'title', this.value)">
                </div>
                <div class="form-group">
                    <label class="input-label">Description (Max 200 chars)</label>
                    <textarea class="form-control" maxlength="200" oninput="updateProjectField(${i}, 'desc', this.value); document.getElementById('char-count-${i}').innerText = this.value.length + '/200'">${proj.desc}</textarea>
                    <div id="char-count-${i}" class="char-counter">${(proj.desc || '').length}/200</div>
                </div>
                <div class="form-group">
                    <label class="input-label">Tech Stack (Enter to add)</label>
                    <div class="tag-input-container">
                        <div class="tag-chips">
                            ${(proj.techStack || []).map((t, ti) => `
                                <div class="tag-chip">
                                    ${t}
                                    <button onclick="removeProjectTech(${i}, ${ti})">&times;</button>
                                </div>
                            `).join('')}
                        </div>
                        <input type="text" class="tag-input" placeholder="React, CSS..." onkeydown="handleProjectTechInput(event, ${i})">
                    </div>
                </div>
                <div class="form-group">
                    <label class="input-label">Live URL</label>
                    <input type="text" class="form-control" value="${proj.liveUrl || ''}" oninput="updateProjectField(${i}, 'liveUrl', this.value)">
                </div>
                <div class="form-group">
                    <label class="input-label">GitHub URL</label>
                    <input type="text" class="form-control" value="${proj.githubUrl || ''}" oninput="updateProjectField(${i}, 'githubUrl', this.value)">
                </div>
            </div>
        </div>
    `).join('');
}

// --- ATS SCORING & IMPROVEMENTS ---
function calculateATSScore() {
    let score = 0;
    const improvements = [];
    const resume = state.resume;
    const p = resume.personal;

    // 1. Name (+10)
    if (p.name && p.name.trim().length > 0) score += 10;
    else improvements.push({ text: "Add your full name", points: 10 });

    // 2. Email (+10)
    if (p.email && p.email.trim().length > 0) score += 10;
    else improvements.push({ text: "Add a professional email", points: 10 });

    // 3. Phone (+5)
    if (p.phone && p.phone.trim().length > 0) score += 5;
    else improvements.push({ text: "Add your phone number", points: 5 });

    // 4. LinkedIn (+5)
    if (p.linkedin && p.linkedin.trim().length > 0) score += 5;
    else improvements.push({ text: "Link your LinkedIn profile", points: 5 });

    // 5. GitHub (+5)
    if (p.github && p.github.trim().length > 0) score += 5;
    else improvements.push({ text: "Link your GitHub repository", points: 5 });

    // 6. Summary > 50 chars (+10)
    const summaryText = p.summary || '';
    if (summaryText.trim().length > 50) score += 10;
    else improvements.push({ text: "Write a summary (min. 50 characters)", points: 10 });

    // 7. Summary contains action verbs (+10)
    const actionVerbs = ['built', 'led', 'designed', 'improved', 'developed', 'created', 'optimized', 'managed', 'implemented'];
    const hasActionVerb = actionVerbs.some(v => summaryText.toLowerCase().includes(v));
    if (hasActionVerb) score += 10;
    else improvements.push({ text: "Use action verbs in summary (built, led, etc.)", points: 10 });

    // 8. At least 1 experience with bullets/desc (+15)
    if (resume.experience.length > 0 && resume.experience.some(e => e.desc && e.desc.trim().length > 5)) {
        score += 15;
    } else {
        improvements.push({ text: "Add work experience with descriptions", points: 15 });
    }

    // 9. At least 1 education (+10)
    if (resume.education.length > 0) score += 10;
    else improvements.push({ text: "Add your education background", points: 10 });

    // 10. At least 1 project (+10)
    if (resume.projects.length > 0) score += 10;
    else improvements.push({ text: "Add at least one project", points: 10 });

    // 11. At least 5 skills (+10)
    const totalSkills = resume.skills.technical.length + resume.skills.soft.length + resume.skills.tools.length;
    if (totalSkills >= 5) score += 10;
    else improvements.push({ text: "Target at least 5 skills", points: 10 });

    score = Math.min(100, score);
    return { score, suggestions: improvements };
}

function renderATSScore() {
    const { score, suggestions } = calculateATSScore();

    // 1. Update Builder UI (Simple bar)
    const scoreVal = document.getElementById('ats-score-value');
    const meterFill = document.getElementById('ats-meter-fill');
    const suggestionsList = document.getElementById('ats-suggestions');

    if (scoreVal) scoreVal.innerText = score;
    if (meterFill) meterFill.style.width = `${score}%`;
    if (suggestionsList) {
        suggestionsList.innerHTML = suggestions.slice(0, 3).map(s => `<div class="suggestion-item">${s.text}</div>`).join('');
    }

    // 2. Update Preview Page UI (Circular)
    const previewScoreVal = document.getElementById('score-value-preview');
    const previewProgress = document.getElementById('score-progress-preview');
    const previewLevel = document.getElementById('score-level-preview');
    const previewSuggestionsList = document.getElementById('suggestions-preview-list');
    const previewWrapper = document.querySelector('.score-display-preview');

    if (previewScoreVal) previewScoreVal.innerText = score;

    if (previewProgress) {
        const radius = 45;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (score / 100) * circumference;
        previewProgress.style.strokeDasharray = `${circumference}`;
        previewProgress.style.strokeDashoffset = offset;
    }

    if (previewLevel) {
        let level = 'Needs Work';
        let levelClass = 'score-level-red';
        let statusClass = 'score-status-red';

        if (score > 70) {
            level = 'Strong Resume';
            levelClass = 'score-level-green';
            statusClass = 'score-status-green';
        } else if (score > 40) {
            level = 'Getting There';
            levelClass = 'score-level-amber';
            statusClass = 'score-status-amber';
        }

        previewLevel.innerText = level;
        previewLevel.className = `score-level-badge ${levelClass}`;
        if (previewWrapper) {
            previewWrapper.className = `score-display-preview ${statusClass}`;
        }
    }

    if (previewSuggestionsList) {
        previewSuggestionsList.innerHTML = suggestions.length > 0
            ? suggestions.map(s => `
                <div class="suggestion-preview-item">
                    <i class="fas fa-plus-circle"></i>
                    <span>${s.text} <span class="suggestion-points">+${s.points} points</span></span>
                </div>
            `).join('')
            : '<div class="suggestion-preview-item" style="color: #10b981;"><i class="fas fa-check-circle" style="color: #10b981;"></i> Your resume is strong!</div>';
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
            { title: 'AI Resume Builder', desc: 'A real-time resume builder with ATS scoring and professional templates.', techStack: ['React', 'JavaScript', 'CSS'], liveUrl: '#', githubUrl: 'https://github.com/zain-146/AI-resume-builder' }
        ],
        skills: {
            technical: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
            soft: ['Problem Solving', 'Teamwork'],
            tools: ['Git', 'VS Code', 'Docker']
        }
    };

    saveState();
    syncInputsFromState();
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
