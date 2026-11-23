import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { ViewerProps } from '../../types';

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '8px 16px',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-secondary)',
    flexShrink: 0,
  },
  button: {
    padding: '4px 12px',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: '14px',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  slideInfo: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  body: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  sidebar: {
    width: '160px',
    overflowY: 'auto',
    borderRight: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-secondary)',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexShrink: 0,
  },
  thumbnail: {
    padding: '12px 8px',
    border: '2px solid var(--border-color)',
    borderRadius: '4px',
    backgroundColor: 'var(--bg-primary)',
    cursor: 'pointer',
    fontSize: '11px',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  thumbnailActive: {
    border: '2px solid var(--accent-color)', // shorthand, so it doesn't conflict with thumbnail.border
    backgroundColor: 'var(--bg-primary)',
  },
  slideArea: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    overflow: 'auto',
  },
  slideCard: {
    width: '100%',
    maxWidth: '720px',
    minHeight: '400px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '40px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  slideText: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: 'var(--text-primary)',
    whiteSpace: 'pre-wrap',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    fontSize: '16px',
    color: 'var(--text-secondary)',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    fontSize: '16px',
    color: '#e53e3e',
    padding: '20px',
    textAlign: 'center',
  },
};

interface SlideContent {
  index: number;
  preview: string;
  elements: SlideElement[];
}

interface SlideSize {
  cx: number;
  cy: number;
}

interface Position {
  x: number;
  y: number;
  w: number;
  h: number;
}

type SlideElement =
  | {
      kind: 'text';
      id: string;
      pos: Position;
      text: string;
      fontSize?: number;
      color?: string;
      align?: React.CSSProperties['textAlign'];
      backgroundColor?: string;
      rounded?: boolean;
    }
  | {
      kind: 'image';
      id: string;
      pos: Position;
      src: string;
      alt: string;
    };

const DEFAULT_SLIDE_SIZE: SlideSize = { cx: 9144000, cy: 6858000 };

/** Matching descendants in document order (= PowerPoint z-order for shapes). */
function getDescendantsByLocalName(root: Element, ...localNames: string[]): Element[] {
  const out: Element[] = [];
  const walk = (node: Element) => {
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (localNames.includes(child.localName)) out.push(child);
      walk(child);
    }
  };
  walk(root);
  return out;
}

function getFirstChildByLocalName(root: Element, localName: string): Element | null {
  const children = root.children;
  for (let i = 0; i < children.length; i++) {
    if (children[i].localName === localName) return children[i];
  }
  return null;
}

function getFirstDescendantByLocalName(root: Element, localName: string): Element | null {
  const found = getDescendantsByLocalName(root, localName);
  return found.length > 0 ? found[0] : null;
}

function getAttr(el: Element | null, name: string): string {
  if (!el) return '';
  return el.getAttribute(name) || '';
}

/** a:srgbClr (with optional a:alpha child) → CSS color. Theme (scheme) colors are not resolved. */
function srgbToCss(clr: Element | null): string | undefined {
  const val = getAttr(clr, 'val');
  if (!/^[0-9a-f]{6}$/i.test(val)) return undefined;
  const alpha = parseInt(getAttr(clr ? getFirstChildByLocalName(clr, 'alpha') : null, 'val'), 10);
  if (Number.isNaN(alpha)) return `#${val}`;
  const n = parseInt(val, 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha / 100000})`;
}

function normalizePath(path: string): string {
  const segments = path.split('/');
  const out: string[] = [];
  for (const seg of segments) {
    if (!seg || seg === '.') continue;
    if (seg === '..') out.pop();
    else out.push(seg);
  }
  return out.join('/');
}

function resolveTarget(baseDir: string, target: string): string {
  return normalizePath(`${baseDir}/${target}`);
}

function getMimeFromFilePath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'bmp':
      return 'image/bmp';
    case 'svg':
      return 'image/svg+xml';
    case 'webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

const PptxViewer: React.FC<ViewerProps> = ({ file }) => {
  const [slides, setSlides] = useState<SlideContent[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideSize, setSlideSize] = useState<SlideSize>(DEFAULT_SLIDE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const objectUrls: string[] = [];

    const readSlideSize = async (zip: JSZip): Promise<SlideSize> => {
      const presentationXml = await zip.file('ppt/presentation.xml')?.async('string');
      if (!presentationXml) return DEFAULT_SLIDE_SIZE;

      const parser = new DOMParser();
      const doc = parser.parseFromString(presentationXml, 'application/xml');
      const sldSz = getDescendantsByLocalName(doc.documentElement, 'sldSz')[0];
      if (!sldSz) return DEFAULT_SLIDE_SIZE;

      const cx = parseInt(getAttr(sldSz, 'cx'), 10);
      const cy = parseInt(getAttr(sldSz, 'cy'), 10);
      if (Number.isNaN(cx) || Number.isNaN(cy)) return DEFAULT_SLIDE_SIZE;
      return { cx, cy };
    };

    const parseRelMap = async (zip: JSZip, relPath: string): Promise<Record<string, string>> => {
      const relXml = await zip.file(relPath)?.async('string');
      if (!relXml) return {};

      const parser = new DOMParser();
      const doc = parser.parseFromString(relXml, 'application/xml');
      const relNodes = getDescendantsByLocalName(doc.documentElement, 'Relationship');
      const map: Record<string, string> = {};

      for (const rel of relNodes) {
        const id = getAttr(rel, 'Id');
        const target = getAttr(rel, 'Target');
        if (id && target) map[id] = target;
      }
      return map;
    };

    const parsePosition = (node: Element): Position => {
      const xfrm = getFirstDescendantByLocalName(node, 'xfrm');
      const off = xfrm ? getFirstChildByLocalName(xfrm, 'off') : null;
      const ext = xfrm ? getFirstChildByLocalName(xfrm, 'ext') : null;

      const x = parseInt(getAttr(off, 'x'), 10);
      const y = parseInt(getAttr(off, 'y'), 10);
      const w = parseInt(getAttr(ext, 'cx'), 10);
      const h = parseInt(getAttr(ext, 'cy'), 10);

      return {
        x: Number.isNaN(x) ? 0 : x,
        y: Number.isNaN(y) ? 0 : y,
        w: Number.isNaN(w) ? DEFAULT_SLIDE_SIZE.cx / 2 : w,
        h: Number.isNaN(h) ? DEFAULT_SLIDE_SIZE.cy / 8 : h,
      };
    };

    const parseParagraphText = (pNode: Element): string => {
      const runs = getDescendantsByLocalName(pNode, 't');
      if (runs.length === 0) return '';
      return runs.map((r) => r.textContent || '').join('');
    };

    const parseShapeText = (shape: Element): { text: string; fontSize?: number; color?: string; align?: React.CSSProperties['textAlign']; backgroundColor?: string; rounded: boolean } => {
      const paragraphs = getDescendantsByLocalName(shape, 'p');
      const text = paragraphs.map(parseParagraphText).filter(Boolean).join('\n').trim();

      const firstRPr = getFirstDescendantByLocalName(shape, 'rPr');
      const sizeRaw = parseInt(getAttr(firstRPr, 'sz'), 10);
      const fontSize = Number.isNaN(sizeRaw) ? undefined : (sizeRaw / 100) * (96 / 72);

      // Only the run's own fill; falling back to the whole shape would pick up the shape fill.
      const runFill = firstRPr ? getFirstChildByLocalName(firstRPr, 'solidFill') : null;
      const color = srgbToCss(runFill ? getFirstChildByLocalName(runFill, 'srgbClr') : null);

      // Direct child only: a:ln also contains a:solidFill (the outline color).
      const spPr = getFirstChildByLocalName(shape, 'spPr');
      const fill = spPr ? getFirstChildByLocalName(spPr, 'solidFill') : null;
      const backgroundColor = srgbToCss(fill ? getFirstChildByLocalName(fill, 'srgbClr') : null);
      const rounded = getAttr(spPr ? getFirstChildByLocalName(spPr, 'prstGeom') : null, 'prst') === 'roundRect';

      let align: React.CSSProperties['textAlign'];
      const pPr = getFirstDescendantByLocalName(shape, 'pPr');
      const algn = getAttr(pPr, 'algn');
      if (algn === 'ctr') align = 'center';
      else if (algn === 'r') align = 'right';
      else align = 'left';

      return { text, fontSize, color, align, backgroundColor, rounded };
    };

    const buildImageUrl = async (zip: JSZip, absPath: string): Promise<string | null> => {
      const fileEntry = zip.file(absPath);
      if (!fileEntry) return null;

      const imageData = await fileEntry.async('arraybuffer');
      const mime = getMimeFromFilePath(absPath);
      const blob = new Blob([imageData], { type: mime });
      const url = URL.createObjectURL(blob);
      objectUrls.push(url);
      return url;
    };

    const extractSlides = async () => {
      try {
        setLoading(true);
        setError(null);
        const zip = await JSZip.loadAsync(file.data);
        const size = await readSlideSize(zip);

        if (mounted) setSlideSize(size);

        const slideFiles: string[] = [];
        zip.forEach((path) => {
          if (/^ppt\/slides\/slide\d+\.xml$/.test(path)) {
            slideFiles.push(path);
          }
        });

        slideFiles.sort((a, b) => {
          const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
          const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
          return numA - numB;
        });

        const parsed: SlideContent[] = [];
        for (let i = 0; i < slideFiles.length; i++) {
          const slidePath = slideFiles[i];
          const relPath = slidePath.replace('slides/slide', 'slides/_rels/slide') + '.rels';
          const relMap = await parseRelMap(zip, relPath);

          const xmlContent = await zip.file(slidePath)?.async('string');
          if (!xmlContent) continue;

          const parser = new DOMParser();
          const doc = parser.parseFromString(xmlContent, 'application/xml');
          const root = doc.documentElement;

          const elements: SlideElement[] = [];

          for (const node of getDescendantsByLocalName(root, 'sp', 'pic')) {
            if (node.localName === 'sp') {
              const parsedText = parseShapeText(node);
              if (!parsedText.text && !parsedText.backgroundColor) continue;

              elements.push({
                kind: 'text',
                id: `s-${i}-sp-${elements.length}`,
                pos: parsePosition(node),
                ...parsedText,
              });
              continue;
            }

            const pic = node;
            const pos = parsePosition(pic);
            const blip = getFirstDescendantByLocalName(pic, 'blip');
            const embedId = getAttr(blip, 'r:embed') || getAttr(blip, 'embed');
            if (!embedId) continue;

            const relTarget = relMap[embedId];
            if (!relTarget) continue;

            const mediaPath = resolveTarget('ppt/slides', relTarget);
            if (getMimeFromFilePath(mediaPath) === 'application/octet-stream') {
              // EMF/WMF/TIFF etc.: browsers can't render them, show a placeholder instead of a broken <img>.
              elements.push({
                kind: 'text',
                id: `s-${i}-img-${elements.length}`,
                pos,
                text: `[Gambar .${mediaPath.split('.').pop()} tidak bisa ditampilkan]`,
                fontSize: 14,
                color: '#666666',
                align: 'center',
                backgroundColor: '#eeeeee',
              });
              continue;
            }
            const src = await buildImageUrl(zip, mediaPath);
            if (!src) continue;

            const nvPicPr = getFirstDescendantByLocalName(pic, 'nvPicPr');
            const cNvPr = nvPicPr ? getFirstDescendantByLocalName(nvPicPr, 'cNvPr') : null;
            const alt = getAttr(cNvPr, 'name') || 'Slide image';

            elements.push({
              kind: 'image',
              id: `s-${i}-img-${elements.length}`,
              pos,
              src,
              alt,
            });
          }

          const firstText = elements.find((el) => el.kind === 'text' && el.text && el.id.includes('-sp-'));
          parsed.push({
            index: i + 1,
            preview: firstText && firstText.kind === 'text' ? firstText.text : 'Image/graphic slide',
            elements,
          });
        }

        if (!mounted) return;
        setSlides(parsed);
        setCurrentSlide(0);
      } catch (err) {
        if (!mounted) return;
        setError(`Failed to parse presentation: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    extractSlides();

    return () => {
      mounted = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [file.data]);

  const prevSlide = () => setCurrentSlide((s) => Math.max(s - 1, 0));
  const nextSlide = () => setCurrentSlide((s) => Math.min(s + 1, slides.length - 1));

  if (loading) return <div style={styles.loading}>Loading presentation...</div>;
  if (error) return <div style={styles.error}>{error}</div>;
  if (slides.length === 0) return <div style={styles.loading}>No slides found</div>;

  const current = slides[currentSlide];
  const aspectRatio = slideSize.cx > 0 && slideSize.cy > 0 ? `${slideSize.cx} / ${slideSize.cy}` : '4 / 3';

  const toPercentX = (x: number) => `${(x / slideSize.cx) * 100}%`;
  const toPercentY = (y: number) => `${(y / slideSize.cy) * 100}%`;
  // Sizes relative to slide width (cqw on the slide card) so text scales with the slide. 9525 EMU = 1px.
  const pxToCqw = (px: number) => `${((px * 9525) / slideSize.cx) * 100}cqw`;
  // PowerPoint default text insets: 0.1in left/right, 0.05in top/bottom (% padding = % of slide width).
  const textPadding = `${toPercentX(45720)} ${toPercentX(91440)}`;

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <button
          style={{ ...styles.button, ...(currentSlide <= 0 ? styles.buttonDisabled : {}) }}
          onClick={prevSlide}
          disabled={currentSlide <= 0}
        >
          ‹ Prev
        </button>
        <span style={styles.slideInfo}>
          Slide {currentSlide + 1} of {slides.length}
        </span>
        <button
          style={{ ...styles.button, ...(currentSlide >= slides.length - 1 ? styles.buttonDisabled : {}) }}
          onClick={nextSlide}
          disabled={currentSlide >= slides.length - 1}
        >
          Next ›
        </button>
      </div>
      <div style={styles.body}>
        <div style={styles.sidebar}>
          {slides.map((slide, idx) => (
            <div
              key={idx}
              style={{ ...styles.thumbnail, ...(idx === currentSlide ? styles.thumbnailActive : {}) }}
              onClick={() => setCurrentSlide(idx)}
            >
              Slide {slide.index}
              {slide.preview && (
                <div style={{ marginTop: '4px', fontSize: '10px' }}>
                  {slide.preview.substring(0, 30)}
                  {slide.preview.length > 30 ? '...' : ''}
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={styles.slideArea}>
          <div
            style={{
              ...styles.slideCard,
              position: 'relative',
              aspectRatio,
              padding: 0,
              overflow: 'hidden',
              minHeight: 0,
              containerType: 'inline-size',
              backgroundColor: '#ffffff', // slides are white by default, independent of app theme
            }}
          >
            {current.elements.length > 0 ? (
              current.elements.map((el) => {
                const baseStyle: React.CSSProperties = {
                  position: 'absolute',
                  left: toPercentX(el.pos.x),
                  top: toPercentY(el.pos.y),
                  width: toPercentX(el.pos.w),
                  height: toPercentY(el.pos.h),
                  boxSizing: 'border-box',
                };

                if (el.kind === 'image') {
                  return (
                    <img
                      key={el.id}
                      src={el.src}
                      alt={el.alt}
                      style={{
                        ...baseStyle,
                        objectFit: 'contain',
                        display: 'block',
                      }}
                    />
                  );
                }

                return (
                  <div
                    key={el.id}
                    style={{
                      ...baseStyle,
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.2,
                      padding: textPadding,
                      fontSize: pxToCqw(el.fontSize ?? 24), // 18pt PowerPoint default
                      color: el.color || '#000000',
                      textAlign: el.align || 'left',
                      backgroundColor: el.backgroundColor || 'transparent',
                      // roundRect default corner = 16.667% of the shorter side
                      borderRadius: el.rounded ? pxToCqw((Math.min(el.pos.w, el.pos.h) * 0.16667) / 9525) : undefined,
                    }}
                  >
                    {el.text}
                  </div>
                );
              })
            ) : (
              <p style={{ ...styles.slideText, color: 'var(--text-secondary)', fontStyle: 'italic', padding: '24px' }}>
                (No renderable text/image content on this slide)
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PptxViewer;
