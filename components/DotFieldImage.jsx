import { useEffect, useRef, memo } from 'react';

import './DotField.css';

const TWO_PI = Math.PI * 2;

// 基于 React Bits DotField 的扩展版：支持用图片为点阵着色。
// - imageSrc：图片按 imageFit（contain/cover）适配容器后，每个点取其所在位置的像素颜色
// - 图片透明/未覆盖区域的点用 fallbackColor 绘制，保持完整点阵场
// - 未传 imageSrc 或图片未加载完成时，退回原版的 gradientFrom/To 线性渐变
// 交互逻辑（bulge/repel、光晕、波动、闪烁）与原版一致。
const DotFieldImage = memo(
  ({
    dotRadius = 1.5,
    dotSpacing = 14,
    cursorRadius = 500,
    cursorForce = 0.1,
    bulgeOnly = true,
    bulgeStrength = 67,
    glowRadius = 160,
    sparkle = false,
    waveAmplitude = 0,
    gradientFrom = 'rgba(168, 85, 247, 0.35)',
    gradientTo = 'rgba(180, 151, 207, 0.25)',
    glowColor = '#120F17',
    imageSrc,
    imageFit = 'contain',
    fallbackColor = 'rgba(148, 163, 184, 0.3)',
    ...rest
  }) => {
    const canvasRef = useRef(null);
    const svgRef = useRef(null);
    const glowRef = useRef(null);
    const dotsRef = useRef([]);
    const mouseRef = useRef({ x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 });
    const rafRef = useRef(null);
    const sizeRef = useRef({ w: 0, h: 0, offsetX: 0, offsetY: 0 });
    const glowOpacity = useRef(0);
    const engagement = useRef(0);
    const propsRef = useRef({});
    propsRef.current = {
      dotRadius,
      dotSpacing,
      cursorRadius,
      cursorForce,
      bulgeOnly,
      bulgeStrength,
      sparkle,
      waveAmplitude,
      gradientFrom,
      gradientTo,
      imageFit,
      fallbackColor
    };
    const rebuildRef = useRef(null);
    const imageRef = useRef(null);
    const colorsReadyRef = useRef(false);
    const glowIdRef = useRef(`dot-field-glow-${Math.random().toString(36).slice(2, 9)}`);

    // 加载取色图片；加载完成后为已有点阵重新着色
    useEffect(() => {
      colorsReadyRef.current = false;
      imageRef.current = null;
      if (!imageSrc) return;
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        imageRef.current = img;
        rebuildRef.current?.();
      };
      img.src = imageSrc;
      return () => {
        img.onload = null;
      };
    }, [imageSrc]);

    useEffect(() => {
      const canvas = canvasRef.current;
      const glowEl = glowRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { alpha: true });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let resizeTimer;

      function resize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(doResize, 100);
      }

      function doResize() {
        const rect = canvas.parentElement.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        sizeRef.current = {
          w,
          h,
          offsetX: rect.left + window.scrollX,
          offsetY: rect.top + window.scrollY,
        };

        buildDots(w, h);
      }

      function buildDots(w, h) {
        const p = propsRef.current;
        const step = p.dotRadius + p.dotSpacing;
        const cols = Math.floor(w / step);
        const rows = Math.floor(h / step);
        const padX = (w % step) / 2;
        const padY = (h % step) / 2;
        const dots = new Array(rows * cols);
        let idx = 0;

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const ax = padX + col * step + step / 2;
            const ay = padY + row * step + step / 2;
            dots[idx++] = { ax, ay, sx: ax, sy: ay, vx: 0, vy: 0, x: ax, y: ay, color: null };
          }
        }
        dotsRef.current = dots;
        assignColors(w, h);
      }

      // 把图片绘制到离屏 canvas 并读取像素，为每个点取其锚点位置的颜色
      function assignColors(w, h) {
        colorsReadyRef.current = false;
        const img = imageRef.current;
        if (!img || w <= 0 || h <= 0) return;

        const off = document.createElement('canvas');
        off.width = w;
        off.height = h;
        const offCtx = off.getContext('2d', { willReadFrequently: true });

        const iw = img.naturalWidth || img.width;
        const ih = img.naturalHeight || img.height;
        if (!iw || !ih) return;

        const p = propsRef.current;
        const scale =
          p.imageFit === 'cover' ? Math.max(w / iw, h / ih) : Math.min(w / iw, h / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        offCtx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);

        let data;
        try {
          data = offCtx.getImageData(0, 0, w, h).data;
        } catch {
          // 跨域图片会污染 canvas，无法取色；保持渐变回退
          return;
        }

        const dots = dotsRef.current;
        for (let i = 0; i < dots.length; i++) {
          const d = dots[i];
          const px = Math.min(w - 1, Math.max(0, Math.round(d.ax)));
          const py = Math.min(h - 1, Math.max(0, Math.round(d.ay)));
          const o = (py * w + px) * 4;
          const a = data[o + 3];
          // 近透明区域 → 用备用色（color 置空）
          d.color = a < 16 ? null : `rgba(${data[o]}, ${data[o + 1]}, ${data[o + 2]}, ${(a / 255).toFixed(3)})`;
        }
        colorsReadyRef.current = true;
      }

      function onMouseMove(e) {
        const s = sizeRef.current;
        mouseRef.current.x = e.pageX - s.offsetX;
        mouseRef.current.y = e.pageY - s.offsetY;
      }

      function updateMouseSpeed() {
        const m = mouseRef.current;
        const dx = m.prevX - m.x;
        const dy = m.prevY - m.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        m.speed += (dist - m.speed) * 0.5;
        if (m.speed < 0.001) m.speed = 0;
        m.prevX = m.x;
        m.prevY = m.y;
      }

      const speedInterval = setInterval(updateMouseSpeed, 20);

      let frameCount = 0;

      function tick() {
        frameCount++;
        const dots = dotsRef.current;
        const m = mouseRef.current;
        const { w, h } = sizeRef.current;
        const p = propsRef.current;
        const len = dots.length;
        const t = frameCount * 0.02;

        const targetEngagement = Math.min(m.speed / 5, 1);
        engagement.current += (targetEngagement - engagement.current) * 0.06;
        if (engagement.current < 0.001) engagement.current = 0;
        const eng = engagement.current;

        glowOpacity.current += (eng - glowOpacity.current) * 0.08;

        if (glowEl) {
          glowEl.setAttribute('cx', m.x);
          glowEl.setAttribute('cy', m.y);
          glowEl.style.opacity = glowOpacity.current;
        }

        ctx.clearRect(0, 0, w, h);

        const useImageColors = colorsReadyRef.current;
        if (!useImageColors) {
          const grad = ctx.createLinearGradient(0, 0, w, h);
          grad.addColorStop(0, p.gradientFrom);
          grad.addColorStop(1, p.gradientTo);
          ctx.fillStyle = grad;
          ctx.beginPath();
        }

        const cr = p.cursorRadius;
        const crSq = cr * cr;
        const rad = p.dotRadius / 2;
        const isBulge = p.bulgeOnly;
        // 备用色的点集中到同一条路径一次填充，只有取到图片颜色的点才逐个填充
        const fallbackPath = useImageColors ? new Path2D() : null;

        for (let i = 0; i < len; i++) {
          const d = dots[i];
          const dx = m.x - d.ax;
          const dy = m.y - d.ay;
          const distSq = dx * dx + dy * dy;

          if (distSq < crSq && eng > 0.01) {
            const dist = Math.sqrt(distSq);
            if (isBulge) {
              const tt = 1 - dist / cr;
              const push = tt * tt * p.bulgeStrength * eng;
              const angle = Math.atan2(dy, dx);
              d.sx += (d.ax - Math.cos(angle) * push - d.sx) * 0.15;
              d.sy += (d.ay - Math.sin(angle) * push - d.sy) * 0.15;
            } else {
              const angle = Math.atan2(dy, dx);
              const move = (500 / dist) * (m.speed * p.cursorForce);
              d.vx += Math.cos(angle) * -move;
              d.vy += Math.sin(angle) * -move;
            }
          } else if (isBulge) {
            d.sx += (d.ax - d.sx) * 0.1;
            d.sy += (d.ay - d.sy) * 0.1;
          }

          if (!isBulge) {
            d.vx *= 0.9;
            d.vy *= 0.9;
            d.x = d.ax + d.vx;
            d.y = d.ay + d.vy;
            d.sx += (d.x - d.sx) * 0.1;
            d.sy += (d.y - d.sy) * 0.1;
          }

          let drawX = d.sx;
          let drawY = d.sy;
          if (p.waveAmplitude > 0) {
            drawY += Math.sin(d.ax * 0.03 + t) * p.waveAmplitude;
            drawX += Math.cos(d.ay * 0.03 + t * 0.7) * p.waveAmplitude * 0.5;
          }

          let r = rad;
          if (p.sparkle) {
            const hash = ((i * 2654435761) ^ (frameCount >> 3)) >>> 0;
            if (hash % 100 < 3) r = rad * 1.8;
          }

          if (useImageColors) {
            if (d.color) {
              ctx.fillStyle = d.color;
              ctx.beginPath();
              ctx.arc(drawX, drawY, r, 0, TWO_PI);
              ctx.fill();
            } else {
              fallbackPath.moveTo(drawX + r, drawY);
              fallbackPath.arc(drawX, drawY, r, 0, TWO_PI);
            }
          } else {
            ctx.moveTo(drawX + r, drawY);
            ctx.arc(drawX, drawY, r, 0, TWO_PI);
          }
        }

        if (useImageColors) {
          ctx.fillStyle = p.fallbackColor;
          ctx.fill(fallbackPath);
        } else {
          ctx.fill();
        }

        rafRef.current = requestAnimationFrame(tick);
      }

      doResize();
      window.addEventListener('resize', resize);
      window.addEventListener('mousemove', onMouseMove, { passive: true });
      rafRef.current = requestAnimationFrame(tick);

      rebuildRef.current = () => {
        const { w, h } = sizeRef.current;
        if (w > 0 && h > 0) buildDots(w, h);
      };

      return () => {
        cancelAnimationFrame(rafRef.current);
        clearInterval(speedInterval);
        clearTimeout(resizeTimer);
        window.removeEventListener('resize', resize);
        window.removeEventListener('mousemove', onMouseMove);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      rebuildRef.current?.();
    }, [dotRadius, dotSpacing]);

    return (
      <div className="dot-field-container" {...rest}>
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
        />
        <svg
          ref={svgRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <defs>
            <radialGradient id={glowIdRef.current}>
              <stop offset="0%" stopColor={glowColor} />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle
            ref={glowRef}
            cx="-9999"
            cy="-9999"
            r={glowRadius}
            fill={`url(#${glowIdRef.current})`}
            style={{ opacity: 0, willChange: 'opacity' }}
          />
        </svg>
      </div>
    );
  }
);

DotFieldImage.displayName = 'DotFieldImage';

export default DotFieldImage;
