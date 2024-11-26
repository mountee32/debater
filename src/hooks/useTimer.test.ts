import { renderHook, act } from '@testing-library/react';
import { useTimer } from './useTimer';

describe('useTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should initialize with the provided time', () => {
    const { result } = renderHook(() => useTimer(60, jest.fn()));
    expect(result.current).toBe(60);
  });

  it('should count down every second', () => {
    const { result } = renderHook(() => useTimer(60, jest.fn()));
    
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current).toBe(58);
  });

  it('should call onTimeEnd when timer reaches zero', () => {
    const onTimeEnd = jest.fn();
    renderHook(() => useTimer(2, onTimeEnd));
    
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(onTimeEnd).toHaveBeenCalledTimes(1);
  });

  it('should stop at zero and not go negative', () => {
    const { result } = renderHook(() => useTimer(2, jest.fn()));
    
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current).toBe(0);
  });

  it('should cleanup interval on unmount', () => {
    const { unmount } = renderHook(() => useTimer(60, jest.fn()));
    
    const clearIntervalSpy = jest.spyOn(window, 'clearInterval');
    
    unmount();
    
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
