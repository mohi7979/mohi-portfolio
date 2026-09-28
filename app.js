const $ = (selector) => document.querySelector(selector);

// داده‌های اولیه و پایدار روی گیت‌هاب پیجز
const initialProjects = [
  {
    id: 'proj-1',
    kind: 'image',
    title: 'هویت بصری و کاراکتر DORTO',
    description: 'طراحی هویت بصری با وکتور تخت ۲.۵ بعدی و فضاسازی کمپین بازگشت به مدرسه.',
    media: 'media/dorto.jpg',
    cover: ''
  },
  {
    id: 'proj-2',
    kind: 'video',
    title: 'موشن‌گرافیک و تیزر تبلیغاتی پرژک',
    description: 'سناریونویسی، تدوین و کامپوزیت ویدیوی تبلیغاتی محصول با استایل کرافت کاغذی و افتر افکت.',
    media: 'media/parjak.mp4',
    cover: ''
  },
  {
    id: 'proj-3',
    kind: 'app',
    title: 'سامانه انتقال گزارش‌های CRM به Excel',
    description: 'اسکریپت و ابزار بهینه‌سازی داده‌ها جهت پردازش خودکار و خروجی گزارش‌های تحلیلی.',
    appUrl: 'https://github.com/mohi7979/mohi-portfolio',
    media: '',
    cover: ''
  }
];

const state = {
  projects: JSON.parse(localStorage.getItem('portfolio_projects')) || initialProjects,
  profile: JSON.parse(localStorage.getItem('portfolio_profile')) || {
    name: 'محدثه رضازاده',
    intro: 'دیجیتال مارکتر، تدوینگر و متخصص هوش مصنوعی (Stable Diffusion & ComfyUI)',
    about: 'فارغ‌التحصیل شیمی کاربردی با تمرکز ویژه بر طراحی دیجیتال، جلوه‌های بصری و بهینه‌سازی فرایندهای تولید محتوا با هوش مصنوعی.',
    email: '',
    social: 'https://github.com/mohi7979'
  },
  library: [],
  filter: 'all',
  password: sessionStorage.getItem('portfolio-admin') || ''
};

let libraryUploading = false;
const labels = { image: 'تصویر', video: 'ویدیو', app: 'اپلیکیشن' };

function setMessage(message, error = false) {
  const element = $('#adminMessage');
  if (!element) return;
  element.textContent = message;
  element.classList.toggle('error', error);
}

function renderProfile() {
  const profile = state.profile;
  const brandEl = $('#brandName');
  const heroNameEl = $('#heroName');
  const heroIntroEl = $('#heroIntro');
  const aboutTextEl = $('#aboutText');

  if (brandEl) brandEl.textContent = profile.name || 'محدثه رضازاده';
  if (heroNameEl) heroNameEl.textContent = profile.name || 'محدثه رضازاده';
  if (heroIntroEl && profile.intro) heroIntroEl.textContent = profile.intro;
  if (aboutTextEl && profile.about) aboutTextEl.textContent = profile.about;

  document.title = `${profile.name || 'نمونه‌کار'} | پورتفولیو`;

  const email = $('#emailLink');
  if (email) {
    email.hidden = !profile.email;
    if (profile.email) {
      email.textContent = profile.email;
      email.href = `mailto:${profile.email}`;
    }
  }

  const social = $('#socialLink');
  if (social) {
    social.hidden = !profile.social;
    if (profile.social) social.href = profile.social;
  }

  const form = $('#profileForm');
  if (form) {
    for (const key of ['name', 'intro', 'about', 'email', 'social']) {
      if (form.elements[key]) form.elements[key].value = profile[key] || '';
    }
  }
}

function mediaNode(project, detail = false) {
  if (project.kind === 'image' && project.media) {
    const image = document.createElement('img');
    image.src = project.media;
    image.alt = project.title;
    image.loading = detail ? 'eager' : 'lazy';
    image.onerror = () => { image.replaceWith(createFallbackNode(project, detail)); };
    return image;
  }

  if (project.kind === 'video' && project.media) {
    const video = document.createElement('video');
    video.src = project.media;
    video.playsInline = true;
    video.preload = 'metadata';
    if (detail) {
      video.controls = true;
      video.controlsList = 'nodownload noplaybackrate';
    } else {
      video.muted = true;
    }
    if (project.cover) video.poster = project.cover;
    return video;
  }

  return createFallbackNode(project, detail);
}

function createFallbackNode(project, detail = false) {
  const placeholder = document.createElement('div');
  placeholder.className = `media-placeholder ${project.kind}${detail ? ' detail-placeholder' : ''}`;
  if (project.kind === 'app' && project.title.includes('CRM')) {
    const mock = document.createElement('div');
    mock.className = 'crm-art';
    mock.innerHTML = '<div class="crm-art-head"><span>CRM → EXCEL</span><span>گزارش‌ها</span></div><div class="crm-art-body"><div class="crm-art-row"><i></i><i></i></div><div class="crm-art-row"><i></i><i></i></div></div><div class="crm-art-bottom">✓ OUTPUT READY</div>';
    placeholder.append(mock);
  } else {
    placeholder.textContent = project.kind === 'app' ? '⌘' : project.kind === 'video' ? '▷' : '✳';
  }
  return placeholder;
}

function slotNode(kind) {
  const slot = document.createElement('div');
  slot.className = `project-slot slot-${kind}`;
  const top = document.createElement('div');
  top.className = 'slot-top';
  const icon = document.createElement('span');
  icon.className = 'slot-icon';
  icon.textContent = { image: '▧', video: '▷', app: '⌘' }[kind];
  const soon = document.createElement('span');
  soon.textContent = 'به‌زودی';
  top.append(icon, soon);
  const content = document.createElement('div');
  content.className = 'slot-content';
  const title = document.createElement('h3');
  title.textContent = { image: 'قاب‌های تصویری', video: 'ویدیوها و موشن', app: 'ابزارهای هوش مصنوعی' }[kind];
  const text = document.createElement('p');
  text.textContent = 'این بخش با نمونه‌کارهای تازه تکمیل می‌شود.';
  content.append(title, text);
  slot.append(top, content);
  return slot;
}

function renderProjects() {
  const visible = state.projects.filter(p => state.filter === 'all' || p.kind === state.filter);
  const countEl = $('#allCount');
  if (countEl) countEl.textContent = String(state.projects.length).padStart(2, '0');

  const grid = $('#projectGrid');
  if (!grid) return;
  grid.replaceChildren();
  grid.classList.toggle('filtered', state.filter !== 'all');

  for (const project of visible) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'project-card';

    const media = document.createElement('div');
    media.className = 'project-media';
    media.append(mediaNode(project));

    const arrow = document.createElement('span');
    arrow.className = 'media-arrow';
    arrow.textContent = '↗';
    media.append(arrow);

    const meta = document.createElement('div');
    meta.className = 'project-meta';
    const type = document.createElement('span');
    type.textContent = labels[project.kind] || 'پروژه';
    const number = document.createElement('span');
    number.textContent = String(state.projects.indexOf(project) + 1).padStart(2, '0');
    meta.append(type, number);

    const title = document.createElement('h3');
    title.textContent = project.title;

    card.append(media, meta, title);
    if (project.description) {
      const desc = document.createElement('p');
      desc.textContent = project.description;
      card.append(desc);
    }

    card.addEventListener('click', () => openProject(project));
    grid.append(card);
  }

  const categories = state.filter === 'all' ? ['image', 'video', 'app'] : [state.filter];
  for (const kind of categories) {
    if (!state.projects.some(project => project.kind === kind)) {
      grid.append(slotNode(kind));
    }
  }

  grid.hidden = false;
  const emptyState = $('#emptyState');
  if (emptyState) emptyState.hidden = true;
  renderAdminList();
}

function renderAdminList() {
  const list = $('#adminProjectList');
  if (!list) return;
  list.replaceChildren();

  if (!state.projects.length) {
    const p = document.createElement('p');
    p.className = 'admin-empty';
    p.textContent = 'هنوز نمونه‌کاری ثبت نشده است.';
    list.append(p);
    return;
  }

  for (const project of state.projects) {
    const row = document.createElement('div');
    row.className = 'admin-project-row';
    const kind = document.createElement('span');
    kind.textContent = labels[project.kind];
    const title = document.createElement('strong');
    title.textContent = project.title;
    const actions = document.createElement('div');
    actions.className = 'admin-project-actions';

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'حذف';
    remove.addEventListener('click', () => {
      if (!confirm(`«${project.title}» حذف شود؟`)) return;
      state.projects = state.projects.filter(p => p.id !== project.id);
      localStorage.setItem('portfolio_projects', JSON.stringify(state.projects));
      renderProjects();
      setMessage('نمونه‌کار حذف شد.');
    });

    actions.append(remove);
    row.append(kind, title, actions);
    list.append(row);
  }
}

function openProject(project) {
  const container = $('#projectDetail');
  if (!container) return;
  container.replaceChildren();

  const media = mediaNode(project, true);
  media.classList.add('detail-media');
  container.append(media);

  const kind = document.createElement('div');
  kind.className = 'detail-kind';
  kind.textContent = labels[project.kind];

  const title = document.createElement('h2');
  title.className = 'detail-title';
  title.textContent = project.title;

  container.append(kind, title);

  if (project.description) {
    const desc = document.createElement('p');
    desc.className = 'detail-description';
    desc.textContent = project.description;
    container.append(desc);
  }

  if (project.kind === 'app' && project.appUrl) {
    const link = document.createElement('a');
    link.className = 'button button-dark detail-link';
    link.href = project.appUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'مشاهدهٔ پروژه / ریپازیتوری ↗';
    container.append(link);
  }

  const dialog = $('#projectDialog');
  if (dialog) dialog.showModal();
}

function setAdminView(loggedIn) {
  const login = $('#loginPanel');
  const admin = $('#adminPanel');
  if (login) login.hidden = loggedIn;
  if (admin) admin.hidden = !loggedIn;
}

function openAdmin() {
  setMessage('');
  setAdminView(!!state.password);
  const dialog = $('#adminDialog');
  if (dialog) dialog.showModal();
}

function showAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(item => item.classList.toggle('active', item.dataset.tab === tab));
  const libraryTab = $('#libraryTab');
  const projectsTab = $('#projectsTab');
  const profileTab = $('#profileTab');
  if (libraryTab) libraryTab.hidden = tab !== 'library';
  if (projectsTab) projectsTab.hidden = tab !== 'projects';
  if (profileTab) profileTab.hidden = tab !== 'profile';
}

// رویدادها
document.querySelectorAll('[data-close]').forEach(button => {
  button.addEventListener('click', () => button.closest('dialog')?.close());
});

document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
});

const openAdminBtn = $('#openAdmin');
if (openAdminBtn) openAdminBtn.addEventListener('click', openAdmin);

const emptyAdminBtn = $('#emptyAdmin');
if (emptyAdminBtn) emptyAdminBtn.addEventListener('click', openAdmin);

document.querySelectorAll('.filter').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach(item => {
      item.classList.toggle('active', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    state.filter = button.dataset.filter;
    renderProjects();
  });
});

document.querySelectorAll('.admin-tab').forEach(button => {
  button.addEventListener('click', () => {
    showAdminTab(button.dataset.tab);
    setMessage('');
  });
});

const loginForm = $('#loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', event => {
    event.preventDefault();
    const pass = (new FormData(loginForm).get('password') || '').toString().trim();
    if (pass === 'admin' || pass === '1234') { // رمز عبور آزمایشی پنل
      state.password = pass;
      sessionStorage.setItem('portfolio-admin', pass);
      setAdminView(true);
      showAdminTab('projects');
      loginForm.reset();
      setMessage('ورود موفقیت‌آمیز بود.');
    } else {
      setMessage('رمز عبور صحیح نیست.', true);
    }
  });
}

const logoutBtn = $('#logout');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    state.password = '';
    sessionStorage.removeItem('portfolio-admin');
    setAdminView(false);
    setMessage('از مدیریت خارج شدید.');
  });
}

const profileForm = $('#profileForm');
if (profileForm) {
  profileForm.addEventListener('submit', event => {
    event.preventDefault();
    const form = new FormData(profileForm);
    const profile = Object.fromEntries(['name', 'intro', 'about', 'email', 'social'].map(key => [key, String(form.get(key) || '').trim()]));
    state.profile = profile;
    localStorage.setItem('portfolio_profile', JSON.stringify(profile));
    renderProfile();
    setMessage('اطلاعات با موفقیت ذخیره شد.');
  });
}

// راه‌اندازی اولیه
renderProfile();
renderProjects();
