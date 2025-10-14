/**
 * @jest-environment jsdom
 */

describe('Flaky Timing-Based Tests', () => {
  let mockHTML;

  beforeEach(() => {
    mockHTML = `
      <div class="async-container">
        <button id="load-data-btn">Load Data</button>
        <div id="data-display"></div>
        <div class="spinner" style="display: none;">Loading...</div>
      </div>
      <div class="animation-target"></div>
      <div class="delayed-element" style="opacity: 0;"></div>
    `;
    document.body.innerHTML = mockHTML;
  });

  afterEach(() => {
    try { jest.runOnlyPendingTimers(); } catch {}
    try { jest.clearAllTimers(); } catch {}
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // FLAKY TEST 1: Race condition with setTimeout
  test('should load data with proper timing (FLAKY: race condition)', async () => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0.5); // deterministic 140ms delay

    const display = document.getElementById('data-display');
    const spinner = document.querySelector('.spinner');
    
    const mockLoadData = () => {
      return new Promise((resolve) => {
        const delay = Math.random() * 120 + 80;
        setTimeout(() => {
          display.textContent = 'Data loaded!';
          spinner.style.display = 'none';
          resolve('success');
        }, delay);
      });
    };

    spinner.style.display = 'block';
    const loadPromise = mockLoadData();

    // Advance past the deterministic delay
    jest.advanceTimersByTime(200);
    await loadPromise;

    expect(display.textContent).toBe('Data loaded!');
    expect(spinner.style.display).toBe('none');
  });

  // FLAKY TEST 2: Animation timing dependency
  test('should complete animation within expected time (FLAKY: animation timing)', () => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0); // deterministic 200ms

    const target = document.querySelector('.animation-target');
    let animationStarted = false;
    let animationCompleted = false;
    
    const mockAnimate = () => {
      animationStarted = true;
      target.style.transition = 'transform 0.3s ease';
      target.style.transform = 'translateX(100px)';
      setTimeout(() => {
        animationCompleted = true;
      }, 200 + Math.random() * 200);
    };

    mockAnimate();
    jest.advanceTimersByTime(250);

    expect(animationStarted).toBe(true);
    expect(animationCompleted).toBe(true);
    expect(target.style.transform).toBe('translateX(100px)');
  });

  // FLAKY TEST 3: Async/await with sufficient waiting using fake timers
  test('should handle multiple async operations (FLAKY: insufficient waiting)', async () => {
    jest.useFakeTimers();
    const results = [];
    
    const asyncOp1 = () => new Promise(resolve => {
      setTimeout(() => {
        results.push('op1');
        resolve('op1');
      }, Math.random() * 100 + 50);
    });
    
    const asyncOp2 = () => new Promise(resolve => {
      setTimeout(() => {
        results.push('op2');
        resolve('op2');
      }, Math.random() * 150 + 80);
    });
    
    const asyncOp3 = () => new Promise(resolve => {
      setTimeout(() => {
        results.push('op3');
        resolve('op3');
      }, Math.random() * 200 + 100);
    });

    const promises = [asyncOp1(), asyncOp2(), asyncOp3()];
    const all = Promise.all(promises);

    // Flush all timers to completion deterministically
    jest.runAllTimers();
    await all;

    expect(results).toEqual(expect.arrayContaining(['op1', 'op2', 'op3']));
    expect(results).toHaveLength(3);
  });

  // FLAKY TEST 4: Event timing with debounce
  test('should handle debounced events correctly (FLAKY: debounce timing)', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00Z'));

    let eventCount = 0;
    let lastEventTime = 0;
    
    const mockDebouncedHandler = (() => {
      let timeout;
      return () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          eventCount++;
          lastEventTime = Date.now();
        }, 180);
      };
    })();

    // Trigger multiple events rapidly
    mockDebouncedHandler();
    jest.advanceTimersByTime(50);
    mockDebouncedHandler();
    jest.advanceTimersByTime(50);
    mockDebouncedHandler();
    jest.advanceTimersByTime(50);
    mockDebouncedHandler();
    jest.advanceTimersByTime(50);
    mockDebouncedHandler();

    // Advance past debounce window to trigger once
    jest.advanceTimersByTime(180);

    expect(eventCount).toBe(1);
    expect(lastEventTime).toBeGreaterThan(0);
  });

  // FLAKY TEST 5: Promise resolution order
  test('should resolve promises and include all results (FLAKY: promise timing)', async () => {
    jest.useFakeTimers();
    const resolveOrder = [];
    
    const promise1 = new Promise(resolve => {
      setTimeout(() => {
        resolveOrder.push('first');
        resolve('first');
      }, Math.random() * 100 + 50);
    });
    
    const promise2 = new Promise(resolve => {
      setTimeout(() => {
        resolveOrder.push('second');
        resolve('second');
      }, Math.random() * 120 + 40);
    });
    
    const promise3 = new Promise(resolve => {
      setTimeout(() => {
        resolveOrder.push('third');
        resolve('third');
      }, Math.random() * 80 + 30);
    });

    const all = Promise.all([promise1, promise2, promise3]);
    jest.runAllTimers();
    await all;
    
    expect(resolveOrder).toEqual(expect.arrayContaining(['first', 'second', 'third']));
    expect(resolveOrder).toHaveLength(3);
  });
});
