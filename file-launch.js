// Classic script so the launch guide still works when file:// blocks ES modules.
if (window.location.protocol === 'file:') {
  const guide = document.createElement('section');
  guide.setAttribute('role', 'alert');
  guide.style.cssText = 'position:fixed;inset:0;z-index:100;background:#102a43;color:#effaff;display:grid;place-content:center;padding:32px;font:18px system-ui;line-height:1.6;';
  const title = document.createElement('h1');
  title.textContent = 'Open Buildtopia through its local server';
  const instructions = document.createElement('p');
  instructions.textContent = 'Run start-buildtopia.bat in the game folder, then open the link below. Opening HTML files directly cannot load the game correctly.';
  instructions.style.maxWidth = '620px';
  const link = document.createElement('a');
  link.href = 'http://127.0.0.1:4173/?v=20261005winter4';
  link.textContent = 'Open Buildtopia';
  link.style.cssText = 'color:#102a43;background:#b3ff91;padding:12px 20px;border-radius:12px;justify-self:start;font-weight:bold;';
  guide.append(title, instructions, link);
  document.body.append(guide);
}
