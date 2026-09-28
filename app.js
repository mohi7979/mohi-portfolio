const $ = (selector) => document.querySelector(selector);
const state = { projects: [], profile: {}, library: [], filter: 'all', password: sessionStorage.getItem('portfolio-admin') || '' };
let libraryUploading = false;
let libraryObserver;
let libraryPreviewUrls = [];
const labels = { image: 'تصویر', video: 'ویدیو', app: 'اپلیکیشن' };
const defaults = {
  intro: $('#heroIntro').textContent,
  about: $('#aboutText').textContent
};

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (state.password) headers['X-Admin-Password'] = state.password;
  const staticPath = path === '/api/profile' ? '/profile.json' : path === '/api/projects' ? '/projects.json' : path;
  const response = await fetch(staticPath, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'درخواست انجام نشد. دوباره تلاش کنید.');
  return data;
}

function setMessage(message, error = false) {
  const element = $('#adminMessage');
  element.textContent = message;
  element.classList.toggle('error', error);
}

function renderProfile() {
  const profile = state.profile;
  $('#heroName').textContent = profile.name || 'نمونه‌کار من';
  $('#brandName').textContent = profile.name || 'نمونه‌کار من';
  $('#heroIntro').textContent = profile.intro || defaults.intro;
  $('#aboutText').textContent = profile.about || defaults.about;
  document.title = `${profile.name || 'نمونه‌کار'} | طراحی و هوش مصنوعی`;
  const email = $('#emailLink');
  email.hidden = !profile.email;
  $('#contactPlaceholder').hidden = !!(profile.email || profile.social);
  if (profile.email) { email.textContent = profile.email; email.href = `mailto:${profile.email}`; }
  const social = $('#socialLink');
  social.hidden = !profile.social;
  if (profile.social) social.href = profile.social;
  const form = $('#profileForm');
  for (const key of ['name', 'intro', 'about', 'email', 'social']) form.elements[key].value = profile[key] || '';
}

function mediaNode(project, detail = false) {
  if (project.kind === 'image' && project.media) {
    const image = document.createElement('img');
    image.src = project.media; image.alt = project.title; image.loading = detail ? 'eager' : 'lazy';
    return image;
  }
  if (detail && project.kind === 'video' && project.media) {
    const video = document.createElement('video');
    video.src = project.media; video.controls = true; video.playsInline = true;
    video.controlsList = 'nodownload noplaybackrate'; video.disablePictureInPicture = true;
    video.preload = 'metadata'; if (project.cover) video.poster = project.cover;
    return video;
  }
  if (project.cover) {
    const image = document.createElement('img');
    image.src = project.cover; image.alt = project.title; image.loading = detail ? 'eager' : 'lazy';
    return image;
  }
  if (project.kind === 'video' && project.media) {
    const video = document.createElement('video');
    video.src = project.media; video.muted = true; video.playsInline = true; video.preload = 'metadata';
    video.controlsList = 'nodownload noplaybackrate'; video.disablePictureInPicture = true;
    return video;
  }
  const placeholder = document.createElement('div');
  placeholder.className = `media-placeholder ${project.kind}${detail ? ' detail-placeholder' : ''}`;
  if (project.kind === 'app' && project.title.includes('CRM')) {
    const mock = document.createElement('div'); mock.className = 'crm-art';
    mock.innerHTML = '<div class="crm-art-head"><span>CRM → EXCEL</span><span>گزارش‌ها</span></div><div class="crm-art-body"><div class="crm-art-row"><i></i><i></i></div><div class="crm-art-row"><i></i><i></i></div><div class="crm-art-row"><i></i><i></i></div></div><div class="crm-art-bottom">✓ OUTPUT READY</div>';
    placeholder.append(mock);
  } else placeholder.textContent = project.kind === 'app' ? '⌘' : project.kind === 'video' ? '▷' : '✳';
  return placeholder;
}

function slotNode(kind) {
  const slot = document.createElement('div'); slot.className = `project-slot slot-${kind}`;
  const top = document.createElement('div'); top.className = 'slot-top';
  const icon = document.createElement('span'); icon.className = 'slot-icon'; icon.textContent = {image:'▧',video:'▷',app:'⌘'}[kind];
  const soon = document.createElement('span'); soon.textContent = 'به‌زودی'; top.append(icon, soon);
  const content = document.createElement('div'); content.className = 'slot-content';
  const title = document.createElement('h3'); title.textContent = {image:'قاب‌های تصویری',video:'ویدیوها و موشن',app:'ابزارهای بعدی'}[kind];
  const text = document.createElement('p'); text.textContent = 'این بخش با نمونه‌کارهای تازه کامل می‌شود.';
  content.append(title,text); slot.append(top,content); return slot;
}

function renderProjects() {
  const visible = state.projects.filter(project => state.filter === 'all' || project.kind === state.filter);
  $('#allCount').textContent = String(state.projects.length).padStart(2, '0');
  const grid = $('#projectGrid'); grid.replaceChildren(); grid.classList.toggle('filtered', state.filter !== 'all');
  for (const project of visible) {
    const card = document.createElement('button'); card.type = 'button'; card.className = 'project-card';
    const media = document.createElement('div'); media.className = 'project-media'; media.append(mediaNode(project));
    const image = media.querySelector('img'); if (image) image.draggable = false;
    const arrow = document.createElement('span'); arrow.className = 'media-arrow'; arrow.textContent = '↗'; media.append(arrow);
    const meta = document.createElement('div'); meta.className = 'project-meta';
    const type = document.createElement('span'); type.textContent = labels[project.kind];
    const number = document.createElement('span'); number.textContent = String(state.projects.indexOf(project) + 1).padStart(2, '0');
    meta.append(type, number);
    const title = document.createElement('h3'); title.textContent = project.title;
    card.append(media, meta, title);
    if (project.description) { const desc = document.createElement('p'); desc.textContent = project.description; card.append(desc); }
    card.addEventListener('click', () => openProject(project)); grid.append(card);
  }
  const categories = state.filter === 'all' ? ['image', 'video', 'app'] : [state.filter];
  for (const kind of categories) if (!state.projects.some(project => project.kind === kind)) grid.append(slotNode(kind));
  grid.hidden = false; $('#emptyState').hidden = true;
  renderAdminList();
}

function renderAdminList() {
  const list = $('#adminProjectList'); list.replaceChildren();
  if (!state.projects.length) { const p = document.createElement('p'); p.className = 'admin-empty'; p.textContent = 'هنوز نمونه‌کاری ثبت نشده است.'; list.append(p); return; }
  for (const project of state.projects) {
    const row = document.createElement('div'); row.className = 'admin-project-row';
    const kind = document.createElement('span'); kind.textContent = labels[project.kind];
    const title = document.createElement('strong'); title.textContent = project.title;
    const actions = document.createElement('div'); actions.className = 'admin-project-actions';
    const view = document.createElement('button'); view.type = 'button'; view.textContent = 'مشاهده';
    view.addEventListener('click', () => openProject(project));
    actions.append(view);
    if (project.media || project.package) {
      const download = document.createElement('button'); download.type = 'button'; download.textContent = 'دریافت';
      download.addEventListener('click', () => downloadProject(project)); actions.append(download);
    }
    const rename = document.createElement('button'); rename.type = 'button'; rename.textContent = 'تغییر نام';
    rename.addEventListener('click', () => renameManagedItem(project, 'project')); actions.append(rename);
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'حذف'; remove.setAttribute('aria-label', `حذف ${project.title}`);
    remove.addEventListener('click', async () => {
      if (!confirm(`«${project.title}» از سایت و کتابخانه حذف شود؟`)) return;
      try { await request(`/api/projects/${encodeURIComponent(project.id)}`, { method: 'DELETE' }); await loadData(); await loadLibrary(); setMessage('نمونه‌کار از سایت و کتابخانه حذف شد.'); }
      catch (error) { setMessage(error.message, true); }
    });
    actions.append(remove); row.append(kind, title, actions); list.append(row);
  }
}

async function renameManagedItem(item, source) {
  const current = source === 'library' ? item.name.replace(/\.[^.]+$/, '') : item.title;
  const title = prompt('نام تازهٔ نمونه‌کار:', current);
  if (title === null || !title.trim() || title.trim() === current) return;
  const path = source === 'library' ? `/api/library/${encodeURIComponent(item.id)}` : `/api/projects/${encodeURIComponent(item.id)}`;
  try {
    await request(path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: title.trim() }) });
    await Promise.all([loadData(), loadLibrary()]);
    setMessage('نام نمونه‌کار در مدیریت و سایت تغییر کرد.');
  } catch (error) { setMessage(error.message, true); }
}

async function libraryAccess(item) {
  return (await request(`/api/library/${encodeURIComponent(item.id)}/access`, { method: 'POST' })).url;
}

async function downloadLibraryItem(item) {
  try {
    const link = document.createElement('a');
    link.href = `${await libraryAccess(item)}&download=1`;
    link.download = item.name;
    document.body.append(link); link.click(); link.remove();
  } catch (error) { setMessage(error.message, true); }
}

async function downloadProject(project) {
  const original = state.library.find(item => item.id === project.libraryId);
  if (original) { await downloadLibraryItem(original); return; }
  const path = project.package || project.media;
  if (!path) return;
  try {
    const response = await fetch(path, { headers: { 'X-Admin-Password': state.password } });
    if (!response.ok) throw new Error('دریافت فایل انجام نشد.');
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a'); link.href = url;
    link.download = `${project.title}${path.slice(path.lastIndexOf('.'))}`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (error) { setMessage(error.message, true); }
}

async function openLibraryItem(item) {
  const viewer = $('#libraryViewer'); viewer.replaceChildren();
  try {
    const url = await libraryAccess(item);
    const media = document.createElement(item.kind === 'video' ? 'video' : 'img');
    media.src = url; media.className = 'library-viewer-media';
    if (item.kind === 'video') { media.controls = true; media.playsInline = true; media.preload = 'metadata'; }
    const title = document.createElement('h2'); title.textContent = item.name;
    const actions = document.createElement('div'); actions.className = 'library-viewer-actions';
    const save = document.createElement('a'); save.href = `${url}&download=1`; save.download = item.name;
    save.className = 'button button-dark'; save.textContent = 'دریافت فایل';
    const rename = document.createElement('button'); rename.type = 'button'; rename.className = 'button button-outline'; rename.textContent = 'تغییر نام';
    rename.addEventListener('click', async () => { await renameManagedItem(item, 'library'); $('#libraryDialog').close(); });
    actions.append(save, rename); viewer.append(media, title, actions);
    $('#libraryDialog').showModal();
  } catch (error) { setMessage(error.message, true); }
}

function fileSize(bytes) {
  const unit = bytes >= 1024 * 1024 ? 'مگابایت' : 'کیلوبایت';
  const amount = bytes >= 1024 * 1024 ? bytes / (1024 * 1024) : bytes / 1024;
  return `${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 }).format(amount)} ${unit}`;
}

async function loadLibrary() {
  const result = await request('/api/library');
  state.library = result.items;
  renderLibrary();
}

async function publishLibraryIds(ids) {
  if (!ids.length) return 0;
  const result = await request('/api/library/publish', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids })
  });
  await loadData();
  renderLibrary();
  return result.added;
}

async function publishAllLibrary(button) {
  const pending = state.library.filter(item => !state.projects.some(project => project.libraryId === item.id));
  if (!pending.length) { setMessage('همهٔ فایل‌های کتابخانه در سایت نمایش داده می‌شوند.'); return; }
  button.disabled = true;
  try {
    const count = await publishLibraryIds(pending.map(item => item.id));
    setMessage(`${new Intl.NumberFormat('fa-IR').format(count)} نمونه‌کار در سایت نمایش داده شد.`);
  } catch (error) { setMessage(error.message, true); }
  finally { button.disabled = false; }
}

async function loadLibraryPreview(image, id) {
  try {
    const response = await fetch(`/api/library/${encodeURIComponent(id)}/file`, { headers: { 'X-Admin-Password': state.password } });
    if (!response.ok) return;
    const url = URL.createObjectURL(await response.blob());
    libraryPreviewUrls.push(url);
    if (image.isConnected) image.src = url;
  } catch { /* The filename remains visible if its preview cannot load. */ }
}

function renderLibrary() {
  if (libraryObserver) libraryObserver.disconnect();
  libraryPreviewUrls.forEach(url => URL.revokeObjectURL(url));
  libraryPreviewUrls = [];
  const grid = $('#libraryGrid'); grid.replaceChildren();
  $('#libraryCount').textContent = new Intl.NumberFormat('fa-IR').format(state.library.length);
  if (!state.library.length) {
    const empty = document.createElement('p'); empty.className = 'library-empty';
    empty.textContent = 'هنوز فایلی اینجا نیست. چند عکس یا ویدیو انتخاب کن تا ذخیره شوند.';
    grid.append(empty); return;
  }
  if ('IntersectionObserver' in window) {
    libraryObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { libraryObserver.unobserve(entry.target); loadLibraryPreview(entry.target, entry.target.dataset.id); }
      });
    }, { root: $('#adminDialog'), rootMargin: '120px' });
  }
  for (const item of state.library) {
    const card = document.createElement('div'); card.className = 'library-card';
    const preview = document.createElement('div'); preview.className = `library-thumb ${item.kind}`;
    if (item.kind === 'image') {
      const image = document.createElement('img'); image.alt = ''; image.dataset.id = item.id;
      image.loading = 'lazy'; preview.append(image);
      if (libraryObserver) libraryObserver.observe(image); else loadLibraryPreview(image, item.id);
    } else { const icon = document.createElement('span'); icon.textContent = '▷'; preview.append(icon); }
    const info = document.createElement('div'); info.className = 'library-info';
    const name = document.createElement('strong'); name.textContent = item.name; name.title = item.name;
    const meta = document.createElement('span'); meta.textContent = `${item.kind === 'image' ? 'تصویر' : 'ویدیو'} · ${fileSize(item.size)}`;
    const published = state.projects.some(project => project.libraryId === item.id);
    const status = document.createElement('span'); status.className = published ? 'library-published' : 'library-pending';
    status.textContent = published ? 'در سایت نمایش داده می‌شود' : 'هنوز در سایت نیست';
    const actions = document.createElement('div'); actions.className = 'library-actions';
    const view = document.createElement('button'); view.type = 'button'; view.textContent = 'مشاهده';
    view.addEventListener('click', () => openLibraryItem(item));
    const download = document.createElement('button'); download.type = 'button'; download.textContent = 'دریافت';
    download.addEventListener('click', () => downloadLibraryItem(item));
    const rename = document.createElement('button'); rename.type = 'button'; rename.textContent = 'تغییر نام';
    rename.addEventListener('click', () => renameManagedItem(item, 'library'));
    actions.append(view, download, rename);
    const publish = document.createElement('button'); publish.type = 'button'; publish.className = 'library-publish';
    publish.textContent = 'نمایش در سایت'; publish.hidden = published;
    publish.addEventListener('click', async () => {
      publish.disabled = true;
      try { await publishLibraryIds([item.id]); setMessage('فایل در سایت نمایش داده شد.'); }
      catch (error) { setMessage(error.message, true); publish.disabled = false; }
    });
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'حذف'; remove.setAttribute('aria-label', `حذف ${item.name} از سایت و کتابخانه`);
    remove.addEventListener('click', async () => {
      if (!confirm(`«${item.name}» از کتابخانه و سایت حذف شود؟`)) return;
      try { await request(`/api/library/${encodeURIComponent(item.id)}`, { method: 'DELETE' }); await Promise.all([loadData(), loadLibrary()]); setMessage('فایل از کتابخانه و سایت حذف شد.'); }
      catch (error) { setMessage(error.message, true); }
    });
    actions.append(remove);
    info.append(name, meta, status, actions, publish); card.append(preview, info); grid.append(card);
  }
}

function uploadLibraryFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/library');
    xhr.setRequestHeader('X-Admin-Password', state.password);
    xhr.setRequestHeader('X-File-Name', encodeURIComponent(file.name));
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.onprogress = event => { if (event.lengthComputable) onProgress(Math.round(event.loaded / event.total * 100)); };
    xhr.onload = () => {
      let result = {};
      try { result = JSON.parse(xhr.responseText); } catch { /* Keep the fallback error. */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(result);
      else reject(new Error(result.error || 'بارگذاری این فایل انجام نشد.'));
    };
    xhr.onerror = () => reject(new Error('ارتباط با سرور قطع شد.'));
    xhr.send(file);
  });
}

async function uploadLibraryBatch(files) {
  if (libraryUploading || !files.length) return;
  libraryUploading = true;
  const feedback = $('#libraryFeedback');
  feedback.textContent = '';
  feedback.classList.remove('error');
  const list = Array.from(files);
  const progressBox = $('#libraryProgressBox'); const progress = $('#libraryProgress');
  progressBox.hidden = false; $('#pickFiles').disabled = true;
  let done = 0; const failed = []; const uploadedIds = [];
  for (let index = 0; index < list.length; index++) {
    const file = list[index]; progress.value = 0;
    $('#libraryProgressLabel').textContent = `در حال بارگذاری: ${file.name}`;
    $('#libraryProgressCount').textContent = `${new Intl.NumberFormat('fa-IR').format(index + 1)} از ${new Intl.NumberFormat('fa-IR').format(list.length)}`;
    try { const item = await uploadLibraryFile(file, value => { progress.value = value; }); uploadedIds.push(item.id); done++; }
    catch (error) { failed.push(`${file.name}: ${error.message}`); }
  }
  libraryUploading = false; progressBox.hidden = true; $('#pickFiles').disabled = false; $('#libraryInput').value = '';
  try {
    if (uploadedIds.length) await publishLibraryIds(uploadedIds);
    await loadLibrary();
  } catch (error) {
    await loadLibrary().catch(() => {});
    feedback.textContent = `${done} فایل در کتابخانه ذخیره شد، اما نمایش در سایت کامل نشد: ${error.message}`;
    feedback.classList.add('error'); return;
  }
  const count = new Intl.NumberFormat('fa-IR').format(done);
  feedback.textContent = failed.length ? `${count} فایل در سایت نمایش داده شد. ${failed.join(' | ')}` : `${count} فایل در سایت نمایش داده شد.`;
  feedback.classList.toggle('error', !!failed.length);
}

function openProject(project) {
  const container = $('#projectDetail'); container.replaceChildren();
  const media = mediaNode(project, true); media.classList.add('detail-media'); container.append(media);
  const kind = document.createElement('div'); kind.className = 'detail-kind'; kind.textContent = labels[project.kind];
  const title = document.createElement('h2'); title.className = 'detail-title'; title.textContent = project.title;
  container.append(kind, title);
  if (project.description) { const description = document.createElement('p'); description.className = 'detail-description'; description.textContent = project.description; container.append(description); }
  if (project.kind === 'app' && project.appUrl) {
    const link = document.createElement('a'); link.className = 'button button-dark detail-link'; link.href = project.appUrl; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'مشاهدهٔ اپلیکیشن ↗'; container.append(link);
  }
  $('#projectDialog').showModal();
}

async function loadData() {
  const [profile, projects] = await Promise.all([request('/api/profile'), request('/api/projects')]);
  state.profile = profile; state.projects = projects.projects; renderProfile(); renderProjects();
}

async function uploadFile(file) {
  const response = await request('/api/media', {
    method: 'POST', headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-File-Name': encodeURIComponent(file.name) }, body: file
  });
  return response.url;
}

function toggleKind() {
  const kind = $('#projectKind').value;
  $('#mediaField').hidden = kind === 'app';
  $('#appField').hidden = kind !== 'app';
  $('#mediaInput').required = kind !== 'app';
  $('#mediaInput').accept = kind === 'video' ? 'video/*' : 'image/*';
  $('#mediaHint').textContent = kind === 'video' ? 'یک فایل ویدیویی انتخاب کنید (تا ۵۰۰ مگابایت).' : 'یک تصویر انتخاب کنید.';
  $('#projectForm').elements.appUrl.required = false;
  $('#mediaInput').value = '';
}

function setAdminView(loggedIn) {
  $('#loginPanel').hidden = loggedIn; $('#adminPanel').hidden = !loggedIn;
}

async function openAdmin() {
  setMessage(''); setAdminView(false); $('#adminDialog').showModal();
  if (state.password) {
    try { await request('/api/admin/check'); }
    catch { state.password = ''; sessionStorage.removeItem('portfolio-admin'); return; }
    setAdminView(true); showAdminTab('library');
    try { await loadData(); await loadLibrary(); } catch (error) { setMessage(error.message, true); }
  }
}

function showAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(item => item.classList.toggle('active', item.dataset.tab === tab));
  $('#libraryTab').hidden = tab !== 'library'; $('#projectsTab').hidden = tab !== 'projects'; $('#profileTab').hidden = tab !== 'profile';
}

document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); }));
$('#libraryDialog').addEventListener('close', () => { const video = $('#libraryViewer video'); if (video) { video.pause(); video.removeAttribute('src'); video.load(); } });
['projectGrid', 'projectDialog'].forEach(id => $(`#${id}`).addEventListener('contextmenu', event => {
  if (event.target.closest('img,video,.project-media')) event.preventDefault();
}));
$('#openAdmin').addEventListener('click', openAdmin);
$('#emptyAdmin').addEventListener('click', openAdmin);
document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.filter').forEach(item => { item.classList.toggle('active', item === button); item.setAttribute('aria-pressed', String(item === button)); });
  state.filter = button.dataset.filter; renderProjects();
}));
document.querySelectorAll('.admin-tab').forEach(button => button.addEventListener('click', () => {
  showAdminTab(button.dataset.tab); setMessage('');
}));
$('#publishAll').addEventListener('click', event => publishAllLibrary(event.currentTarget));
$('#publishAllLibrary').addEventListener('click', event => publishAllLibrary(event.currentTarget));
$('#uploadDrop').addEventListener('click', event => { if (!libraryUploading && event.target !== $('#libraryInput')) $('#libraryInput').click(); });
$('#uploadDrop').addEventListener('keydown', event => { if (!libraryUploading && event.target === $('#uploadDrop') && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); $('#libraryInput').click(); } });
['dragenter', 'dragover'].forEach(type => $('#uploadDrop').addEventListener(type, event => { event.preventDefault(); $('#uploadDrop').classList.add('dragging'); }));
['dragleave', 'drop'].forEach(type => $('#uploadDrop').addEventListener(type, event => { event.preventDefault(); $('#uploadDrop').classList.remove('dragging'); }));
$('#uploadDrop').addEventListener('drop', event => uploadLibraryBatch(event.dataTransfer.files));
$('#libraryInput').addEventListener('change', event => uploadLibraryBatch(event.target.files));
$('#projectKind').addEventListener('change', toggleKind);
$('#loginForm').addEventListener('submit', async event => {
  event.preventDefault(); const loginForm = event.currentTarget;
  state.password = String(new FormData(loginForm).get('password') || '').trim();
  try { await request('/api/admin/check'); }
  catch (error) { state.password = ''; setMessage(error.message, true); return; }
  sessionStorage.setItem('portfolio-admin', state.password);
  setAdminView(true); showAdminTab('library'); loginForm.reset();
  try { await loadData(); await loadLibrary(); setMessage('حالا می‌توانی چند فایل را با هم بارگذاری کنی.'); }
  catch (error) { setMessage(error.message, true); }
});
$('#logout').addEventListener('click', () => { state.password = ''; sessionStorage.removeItem('portfolio-admin'); setAdminView(false); state.library = []; renderLibrary(); loadData().catch(() => {}); setMessage('از مدیریت خارج شدید.'); });
$('#profileForm').addEventListener('submit', async event => {
  event.preventDefault(); const form = new FormData(event.currentTarget);
  const profile = Object.fromEntries(['name','intro','about','email','social'].map(key => [key, String(form.get(key) || '').trim()]));
  try { state.profile = await request('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) }); renderProfile(); setMessage('تغییرات معرفی ذخیره شد.'); }
  catch (error) { setMessage(error.message, true); }
});
$('#projectForm').addEventListener('submit', async event => {
  event.preventDefault(); const projectForm = event.currentTarget;
  const button = $('#saveProject'); button.disabled = true; button.textContent = 'در حال بارگذاری...'; setMessage('فایل‌ها در حال بارگذاری‌اند؛ این صفحه را باز نگه دارید.');
  const form = new FormData(projectForm);
  try {
    const kind = form.get('kind');
    const mediaFile = form.get('media'); const coverFile = form.get('cover'); const packageFile = form.get('package');
    const media = kind !== 'app' && mediaFile?.size ? await uploadFile(mediaFile) : '';
    const cover = coverFile?.size ? await uploadFile(coverFile) : '';
    const appPackage = kind === 'app' && packageFile?.size ? await uploadFile(packageFile) : '';
    await request('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: form.get('title'), kind, description: form.get('description'), appUrl: form.get('appUrl'), media, cover, package: appPackage }) });
    projectForm.reset(); toggleKind(); await loadData(); setMessage('نمونه‌کار اضافه شد و برای بازدیدکننده‌ها نمایش داده می‌شود.');
  } catch (error) { setMessage(error.message, true); }
  finally { button.disabled = false; button.innerHTML = 'افزودن نمونه‌کار <span aria-hidden="true">＋</span>'; }
});
loadData().catch(() => { $('#emptyState').hidden = true; $('#projectGrid').innerHTML = '<p class="load-error">اتصال به سرور برقرار نشد. صفحه را دوباره بارگذاری کنید.</p>'; });
if (/^\/admin\/?$/.test(location.pathname)) openAdmin();
