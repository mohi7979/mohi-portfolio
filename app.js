const defaultProjects = [
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

const defaultProfile = {
  name: 'محدثه رضازاده',
  intro: 'دیجیتال مارکتر، تدوینگر و متخصص هوش مصنوعی (Stable Diffusion & ComfyUI)',
  about: 'فارغ‌التحصیل شیمی کاربردی با تمرکز ویژه بر طراحی دیجیتال، جلوه‌های بصری و بهینه‌سازی فرایندهای تولید محتوا با هوش مصنوعی.',
  email: '',
  social: 'https://github.com/mohi7979'
};

const state = {
  projects: JSON.parse(localStorage.getItem('mohi_projects') || 'null') || defaultProjects,
  profile: JSON.parse(localStorage.getItem('mohi_profile') || 'null') || defaultProfile,
  filter: 'all',
  password: sessionStorage.getItem('mohi_admin_auth') || ''
};

function setMessage(message, error = false) {
  const element = document.getElementById('adminMessage');
  if (!element) return;
  element.textContent = message;
  element.classList.toggle('error', error);
}

function renderProfile() {
  const email = document.getElementById('footerEmail');
  const social = document.getElementById('footerSocial');
  if (email) {
    email.hidden = !state.profile.email;
    email.href = `mailto:${state.profile.email}`;
  }
  if (social) {
    social.hidden = !state.profile.social;
    social.href = state.profile.social;
  }
}

function createFallbackNode(project, detail = false) {
  const placeholder = document.createElement('div');
  placeholder.className = `media-placeholder ${project.kind}${detail ? ' detail-placeholder' : ''}`;
  if (project.kind === 'app') {
    const mock = document.createElement('div');
    mock.className = 'crm-art';
    mock.innerHTML = '<span>CRM → EXCEL</span><small>✓ خروجی آماده</small>';
    placeholder.append(mock);
  } else {
    placeholder.textContent = project.kind === 'video' ? '▷' : '✳';
  }
  return placeholder;
}

function mediaNode(project, detail = false) {
  if (project.kind === 'video' && project.media) {
    const video = document.createElement('video');
    video.src = project.media;
    video.controls = detail;
    video.playsInline = true;
    if (!detail) {
      video.muted = true;
      video.loop = true;
      video.autoplay = true;
    }
    return video;
  }
  if (project.media) {
    const image = document.createElement('img');
    image.src = project.media;
    image.alt = project.title;
    image.loading = detail ? 'eager' : 'lazy';
    image.onerror = () => { image.replaceWith(createFallbackNode(project, detail)); };
    return image;
  }
  return createFallbackNode(project, detail);
}

function renderProjects() {
  const grid = document.getElementById('projectGrid');
  if (!grid) return;
  grid.replaceChildren();

  const labels = { image: 'تصویر', video: 'ویدیو', app: 'ابزار' };
  const filtered = state.projects.filter(p => state.filter === 'all' || p.kind === state.filter);

  filtered.forEach((project, idx) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'project-card';
    card.onclick = () => openProject(project);

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
    number.textContent = String(idx + 1).padStart(2, '0');
    meta.append(type, number);

    const title = document.createElement('h3');
    title.className = 'project-title';
    title.textContent = project.title;

    const desc = document.createElement('p');
    desc.className = 'project-summary';
    desc.textContent = project.description;

    card.append(media, meta, title, desc);
    grid.append(card);
  });
}

function openProject(project) {
  const dialog = document.getElementById('projectDialog');
  const container = document.getElementById('projectDetail');
  if (!dialog || !container) return;

  container.replaceChildren();

  const media = document.createElement('div');
  media.className = 'project-media detail-media';
  media.append(mediaNode(project, true));
  container.append(media);

  const title = document.createElement('h2');
  title.className = 'detail-title';
  title.textContent = project.title;
  container.append(title);

  const desc = document.createElement('p');
  desc.className = 'detail-description';
  desc.textContent = project.description;
  container.append(desc);

  if (project.appUrl) {
    const link = document.createElement('a');
    link.className = 'button button-dark detail-link';
    link.href = project.appUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'مشاهده مخزن ابزار ↗';
    container.append(link);
  }

  dialog.showModal();
}

// فیلترها و دکمه‌ها
document.addEventListener('DOMContentLoaded', () => {
  renderProfile();
  renderProjects();

  const filters = document.querySelectorAll('.filter');
  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      filters.forEach(f => f.classList.remove('active'));
      btn.classList.add('active');
      state.filter = btn.dataset.filter;
      renderProjects();
    });
  });

  const dialog = document.getElementById('projectDialog');
  const closeBtn = document.getElementById('closeProject');
  if (closeBtn && dialog) {
    closeBtn.addEventListener('click', () => dialog.close());
  }
});
