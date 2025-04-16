import { frag, requestIdleCallback } from 'lib';

type CarouselOpts = {
  selector: string;
  itemWidth: number; // itemWidth is a suggestion
  pauseFor: Seconds;
  slideFor?: Seconds;
};

export function makeCarousel({ selector, itemWidth, pauseFor, slideFor = 0.6 }: CarouselOpts): void {
  let timer: number | undefined = undefined;

  requestIdleCallback(() => {
    const el = document.querySelector<HTMLElement>(selector)!;
    if (!el) return;

    const track = frag<HTMLElement>('<div class="track"></div>');
    track.append(...el.children);
    el.innerHTML = '';
    el.append(track);
    el.style.visibility = 'visible';

    onResize();
    window.addEventListener('resize', onResize);

    function onResize() {
      const kids = [...track.children].filter((k): k is HTMLElement => k instanceof HTMLElement);
      const styleGap = toPx('gap', el);
      const gap = Number.isNaN(styleGap) ? 0 : styleGap;
      const visible = Math.floor((el.clientWidth + gap) / (itemWidth + gap));
      const itemW = (el.clientWidth - gap * (visible - 1)) / visible;

      kids.forEach(k => (k.style.width = `${itemW}px`));
      kids.forEach(k => (k.style.marginRight = `${gap}px`));

      const rotateInner = () => {
        kids.forEach(k => (k.style.transition = `transform ${slideFor}s ease`));
        kids.forEach(k => (k.style.transform = `translateX(-${itemW + gap}px)`));
        setTimeout(() => {
          track.append(track.firstChild!);
          fix();
        }, slideFor * 1000);
      };

      const fix = () => {
        kids.forEach(k => (k.style.transition = ''));
        kids.forEach(k => (k.style.transform = ''));
      };
      fix();

      clearInterval(timer);
      if (kids.length > visible) timer = setInterval(rotateInner, pauseFor * 1000);
    }
  });
}

function toPx(key: keyof CSSStyleDeclaration, contextEl: HTMLElement = document.body): number {
  // must be simple units like vw, em, and %. things like 'auto' will return NaN
  const style = window.getComputedStyle(contextEl);
  const el = frag<HTMLElement>(`<div style="position:absolute;visibility:hidden;width:${style[key]}"/>`);
  contextEl.append(el);
  const pixels = parseFloat(window.getComputedStyle(el).width);
  el.remove();
  return pixels;
}
