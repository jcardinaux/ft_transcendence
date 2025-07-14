let zIndexCounter = 100; // Z-index base da cui partire


export interface Win98WindowOptions {
  title: string;
  content: string;
  draggable?: boolean;
  onClose?: () => void; // <-- Aggiunto
}

export class Win98Window {
  element: HTMLElement;

  constructor(options: Win98WindowOptions) {
    const wrapper = document.createElement('div');
    wrapper.className = 'window-frame-win98';
    wrapper.style.position = 'absolute';
    wrapper.style.top = '100px';
    wrapper.style.left = '100px';

    // Inizialmente assegna z-index crescente
    wrapper.style.zIndex = String(zIndexCounter++);
    
    wrapper.innerHTML = `
      <div class="title-bar-win98" data-drag>
        <span>${options.title}</span>
        <div class="title-bar-button-win98" data-close>&times;</div>
      </div>
      <div class="window-content-win98">
        ${options.content}
      </div>
    `;

    // Chiusura finestra
    wrapper.querySelector('[data-close]')?.addEventListener('click', () => {
      wrapper.remove();
      options.onClose?.();
    });

    // Quando clicchi sulla finestra, portala in primo piano
    wrapper.addEventListener('mousedown', () => {
    wrapper.style.zIndex = String(zIndexCounter++);

    document.querySelectorAll('.window-frame-win98').forEach(w => {
      w.classList.remove('focused');
    });

  wrapper.classList.add('focused');
});


    if (options.draggable !== false) {
      this.enableDrag(wrapper);
    }

    this.element = wrapper;
  }

  private enableDrag(el: HTMLElement) {
    const titleBar = el.querySelector('[data-drag]') as HTMLElement;
    if (!titleBar) return;

    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      offsetX = e.clientX - el.offsetLeft;
      offsetY = e.clientY - el.offsetTop;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      el.style.left = `${e.clientX - offsetX}px`;
      el.style.top = `${e.clientY - offsetY}px`;
    };

    const onMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    titleBar.addEventListener('mousedown', onMouseDown);
  }
}
