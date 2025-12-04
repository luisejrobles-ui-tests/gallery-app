require('@testing-library/jest-dom');

// Mock window methods that aren't available in jsdom
global.alert = jest.fn();
global.scrollTo = jest.fn();

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  trigger: (entries) => callback(entries)
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 0));
global.cancelAnimationFrame = jest.fn();

// Mock window.pageYOffset
Object.defineProperty(window, 'pageYOffset', {
  value: 0,
  writable: true
});

// Mock window.innerHeight
Object.defineProperty(window, 'innerHeight', {
  value: 1024,
  writable: true
});

// Mock canvas methods for HTMLCanvasElement
HTMLCanvasElement.prototype.getContext = jest.fn((contextType) => {
  if (contextType === '2d') {
    return {
      fillStyle: '',
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn((x, y, w, h) => ({
        data: new Uint8ClampedArray(w * h * 4)
      })),
      putImageData: jest.fn(),
      createImageData: jest.fn(),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      stroke: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      measureText: jest.fn(() => ({ width: 0 })),
      transform: jest.fn(),
      rect: jest.fn(),
      clip: jest.fn(),
    };
  } else if (contextType === 'webgl' || contextType === 'experimental-webgl') {
    return {
      getParameter: jest.fn((param) => {
        if (param === 7936) return 'WebKit WebGL'; // RENDERER
        if (param === 7937) return 'WebKit'; // VENDOR
        return null;
      }),
      createBuffer: jest.fn(),
      bindBuffer: jest.fn(),
      bufferData: jest.fn(),
      createProgram: jest.fn(),
      createShader: jest.fn(),
      shaderSource: jest.fn(),
      compileShader: jest.fn(),
      attachShader: jest.fn(),
      linkProgram: jest.fn(),
      useProgram: jest.fn(),
    };
  }
  return null;
});

// Setup DOM before each test
beforeEach(() => {
  // Reset DOM
  document.body.innerHTML = '';
  document.head.innerHTML = '';

  // Reset window scroll position
  window.pageYOffset = 0;

  // Clear all mocks
  jest.clearAllMocks();
}); 