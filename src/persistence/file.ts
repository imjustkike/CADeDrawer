import { Project, Sheet } from '../domain/types';

export const LOCAL_STORAGE_AUTOSAVE_KEY = 'circuit_studio_autosave_v1';
export const LOCAL_STORAGE_RECENTS_KEY = 'circuit_studio_recents_v1';

export function saveProjectToLocalStorage(project: Project): void {
  try {
    const payload = JSON.stringify(project);
    localStorage.setItem(LOCAL_STORAGE_AUTOSAVE_KEY, payload);
  } catch (err) {
    console.error('Failed to autosave project:', err);
  }
}

export function loadProjectFromLocalStorage(): Project | null {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_AUTOSAVE_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    if (parsed && parsed.metadata && parsed.sheets) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to load autosaved project:', err);
  }
  return null;
}

export function exportProjectToJson(project: Project): string {
  const cleanProject = {
    ...project,
    metadata: {
      ...project.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
  return JSON.stringify(cleanProject, null, 2);
}

export function downloadFile(content: string, filename: string, mimeType: string = 'application/json') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseProjectJson(jsonStr: string): Project {
  const parsed = JSON.parse(jsonStr);
  if (!parsed || !parsed.metadata || !parsed.sheets) {
    throw new Error('El archivo no tiene la estructura de un proyecto válido de Circuit Studio (.circuit)');
  }
  return parsed as Project;
}

export function exportSvgElement(svgElement: SVGSVGElement, filename: string = 'esquema.svg') {
  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svgElement);

  // Add namespaces if not present
  if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
    source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }

  const svgBlob = new Blob(['<?xml version="1.0" standalone="no"?>\r\n', source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportPngElement(svgElement: SVGSVGElement, filename: string = 'esquema.png', scale: number = 2) {
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svgElement);
  const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const bbox = svgElement.viewBox.baseVal;
    const w = (bbox.width > 0 ? bbox.width : 1200) * scale;
    const h = (bbox.height > 0 ? bbox.height : 800) * scale;

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const pngUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(pngUrl);
    }, 'image/png');

    URL.revokeObjectURL(url);
  };
  img.src = url;
}
