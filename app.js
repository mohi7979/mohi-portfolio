const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const state = {
  profile: null,
  projects: [],
  assets: [],
  customFields: []
};

async function loadData() {
  try {
    const [profileRes, projectsRes, assetsRes, customFieldsRes] = await Promise.all([
      fetch('profile.json').then(r => r.ok ? r.json() : {}),
      fetch('projects.json').then(r => r.ok ? r.json() : { projects: [] }),
      fetch('assets.json').then(r => r.ok ? r.json() : { assets: [] }).catch(() => ({ assets: [] })),
      fetch('custom_fields.json').then(r => r.ok ? r.json() : { fields: [] }).catch(() => ({ fields: [] }))
    ]);

    state.profile = profileRes;
    state.projects = projectsRes.projects || [];
    state.assets = assetsRes.assets || [];
    state.customFields = customFieldsRes.fields || [];

    renderProfile();
    renderProjects();
    renderCustomFields();
  } catch (err) {
    console.error('Error loading portfolio data:', err);
  }
}

function renderProfile() {
  const profile = state.profile || {};
  if ($('#heroName')) $('#heroName').textContent = profile.name || 'محدثه رضازاده';
  if ($('#brandName')) $('#brandName').textContent = profile.name || 'محدثه رضازاده';
  if ($('#heroIntro')) $('#heroIntro').textContent = profile.intro || '';
  if ($('#aboutText')) $('#aboutText').textContent = profile.about || '';
  
  const email = $('#contactEmail');
  const social = $('#contactSocial');
  const placeholder = $('#contactPlaceholder');

  if (email) {
    email.hidden = !profile.email;
    if (profile.email) {
      email.href = `mailto:${profile.email}`;
      email.textContent = profile.email;
    }
  }

  if (social) {
    social.hidden = !profile.social;
    if (profile.social) {
      social.href = profile.social.startsWith('http') ? profile.social : `https://${profile.social}`;
      social.textContent = profile.social_label || 'شبکهٔ اجتماعی ↗';
    }
  }

  if (placeholder) {
    placeholder.hidden = !!(profile.email || profile.social);
  }
}

function mediaNode(project, detail = false) {
  const placeholder = document.createElement('div');
  placeholder.className = `media-placeholder ${project.kind || ''}${detail ? ' detail-placeholder' : ''}`;

  if (project.media) {
    const isVideo = project.kind === 'video' || /\.(mp4|webm|mov)$/i.test(project.media);
    if (isVideo) {
      const video = document.createElement('video');
      video.src = project.media;
      video.controls = detail;
      video.autoplay = !detail;
      video.loop = !detail;
      video.muted = !detail;
      video.playsInline = true;
      video.preload = 'metadata';
      if (project.cover) video.poster = project.cover;
      return video;
    } else {
      const img = document.createElement('img');
      img.src = project.media;
      img.alt = project.title || 'تصویر نمونه‌کار';
      img.loading = detail ? 'eager' : 'lazy';
      return img;
    }
  }

  if (project.cover) {
    const img = document.createElement('img');
    img.src = project.cover;
    img.alt = project.title || 'کاور';
    return img;
  }

  placeholder.textContent = project.kind === 'app' ? '⌘' : project.kind === 'video' ? '▷' : '✳';
  return placeholder;
}

function renderProjects() {
  const grid = $('#projectsGrid');
  const emptyState = $('#emptyState');
  if (!grid) return;

  grid.innerHTML = '';
  if (!state.projects.length) {
    grid.hidden = true;
    if (emptyState) emptyState.hidden = false;
    return;
  }

  grid.hidden = false;
  if (emptyState) emptyState.hidden = true;

  state.projects.forEach((project, index) => {
    const card = document.createElement('article');
    card.className = 'project-card';
    card.tabIndex = 0;

    const mediaWrapper = document.createElement('div');
    mediaWrapper.className = 'project-card-media';
    mediaWrapper.append(mediaNode(project, false));

    const meta = document.createElement('div');
    meta.className = 'project-card-meta';

    const type = document.createElement('span');
    type.className = 'project-card-type';
    type.textContent = project.kind_label || (project.kind === 'video' ? 'ویدیو' : project.kind === 'app' ? 'ابزار' : 'طراحی');

    const number = document.createElement('span');
    number.className = 'project-card-number';
    number.textContent = String(index + 1).padStart(2, '0');

    meta.append(type, number);

    const title = document.createElement('h3');
    title.className = 'project-card-title';
    title.textContent = project.title || 'پروژه بدون عنوان';

    card.append(mediaWrapper, meta, title);

    card.addEventListener('click', () => openProject(project));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openProject(project);
      }
    });

    grid.append(card);
  });
}

function renderCustomFields() {
  // اگر فیلد سفارشی وجود داشته باشد
}

function openProject(project) {
  const dialog = $('#projectDialog');
  const viewer = $('#projectViewer');
  if (!dialog || !viewer) return;

  viewer.innerHTML = '';

  const media = mediaNode(project, true);
  const info = document.createElement('div');
  info.className = 'project-dialog-info';

  const title = document.createElement('h2');
  title.textContent = project.title;

  const desc = document.createElement('p');
  desc.textContent = project.description || '';

  info.append(title, desc);

  if (project.app_url) {
    const link = document.createElement('a');
    link.href = project.app_url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'button button-primary';
    link.textContent = 'مشاهده ابزار / لینک ↗';
    info.append(link);
  }

  viewer.append(media, info);
  dialog.showModal();
}

document.addEventListener('DOMContentLoaded', () => {
  loadData();

  const closeDialog = $('#closeProjectDialog');
  if (closeDialog) {
    closeDialog.addEventListener('click', () => {
      const dialog = $('#projectDialog');
      if (dialog) dialog.close();
    });
  }

  const dialog = $('#projectDialog');
  if (dialog) {
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
  }
});
