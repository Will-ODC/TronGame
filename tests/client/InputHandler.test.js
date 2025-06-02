const InputHandler = require('../../src/client/InputHandler');

/**
 * InputHandler Class Unit Tests
 * 
 * These tests verify keyboard input handling:
 * 1. Event listener setup
 * 2. Correct key mappings (arrows and WASD)
 * 3. Callback execution
 * 4. Input enable/disable functionality
 * 5. Event prevention
 */

describe('InputHandler Class', () => {
  let inputHandler;
  let mockCallback;

  beforeEach(() => {
    inputHandler = new InputHandler();
    mockCallback = jest.fn();
    
    // Clear any existing event listeners
    document.removeEventListener('keydown', inputHandler.setupEventListeners);
  });

  describe('Initialization', () => {
    it('should initialize with correct default values', () => {
      expect(inputHandler.callbacks.onTurn).toBeNull();
      expect(inputHandler.enabled).toBe(false);
    });

    it('should set up event listeners on construction', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      new InputHandler();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('Callback Registration', () => {
    it('should register turn callback', () => {
      inputHandler.onTurn(mockCallback);
      expect(inputHandler.callbacks.onTurn).toBe(mockCallback);
    });
  });

  describe('Enable/Disable', () => {
    it('should enable input handling', () => {
      inputHandler.setEnabled(true);
      expect(inputHandler.enabled).toBe(true);
    });

    it('should disable input handling', () => {
      inputHandler.setEnabled(false);
      expect(inputHandler.enabled).toBe(false);
    });
  });

  describe('Keyboard Input Handling', () => {
    beforeEach(() => {
      inputHandler.onTurn(mockCallback);
      inputHandler.setEnabled(true);
    });

    describe('Arrow Keys', () => {
      it('should handle left arrow key', () => {
        const event = new KeyboardEvent('keydown', { 
          key: 'ArrowLeft',
          preventDefault: jest.fn()
        });
        
        document.dispatchEvent(event);
        
        expect(mockCallback).toHaveBeenCalledWith('left');
        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('should handle right arrow key', () => {
        const event = new KeyboardEvent('keydown', { 
          key: 'ArrowRight',
          preventDefault: jest.fn()
        });
        
        document.dispatchEvent(event);
        
        expect(mockCallback).toHaveBeenCalledWith('right');
        expect(event.preventDefault).toHaveBeenCalled();
      });
    });

    describe('WASD Keys', () => {
      it('should handle A key (lowercase)', () => {
        const event = new KeyboardEvent('keydown', { 
          key: 'a',
          preventDefault: jest.fn()
        });
        
        document.dispatchEvent(event);
        
        expect(mockCallback).toHaveBeenCalledWith('left');
        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('should handle A key (uppercase)', () => {
        const event = new KeyboardEvent('keydown', { 
          key: 'A',
          preventDefault: jest.fn()
        });
        
        document.dispatchEvent(event);
        
        expect(mockCallback).toHaveBeenCalledWith('left');
        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('should handle D key (lowercase)', () => {
        const event = new KeyboardEvent('keydown', { 
          key: 'd',
          preventDefault: jest.fn()
        });
        
        document.dispatchEvent(event);
        
        expect(mockCallback).toHaveBeenCalledWith('right');
        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('should handle D key (uppercase)', () => {
        const event = new KeyboardEvent('keydown', { 
          key: 'D',
          preventDefault: jest.fn()
        });
        
        document.dispatchEvent(event);
        
        expect(mockCallback).toHaveBeenCalledWith('right');
        expect(event.preventDefault).toHaveBeenCalled();
      });
    });

    describe('Other Keys', () => {
      it('should ignore other keys', () => {
        const event = new KeyboardEvent('keydown', { 
          key: 'Space',
          preventDefault: jest.fn()
        });
        
        document.dispatchEvent(event);
        
        expect(mockCallback).not.toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();
      });

      it('should ignore up arrow', () => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
        document.dispatchEvent(event);
        expect(mockCallback).not.toHaveBeenCalled();
      });

      it('should ignore down arrow', () => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
        document.dispatchEvent(event);
        expect(mockCallback).not.toHaveBeenCalled();
      });
    });
  });

  describe('Disabled State', () => {
    it('should not call callback when disabled', () => {
      inputHandler.onTurn(mockCallback);
      inputHandler.setEnabled(false); // Disabled
      
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      document.dispatchEvent(event);
      
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should not crash when no callback is set', () => {
      inputHandler.setEnabled(true);
      // No callback set
      
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      
      // Should not throw
      expect(() => document.dispatchEvent(event)).not.toThrow();
    });
  });

  describe('Multiple Instances', () => {
    it('should handle multiple InputHandler instances', () => {
      const handler1 = new InputHandler();
      const handler2 = new InputHandler();
      
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      handler1.onTurn(callback1);
      handler2.onTurn(callback2);
      
      handler1.setEnabled(true);
      handler2.setEnabled(true);
      
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      document.dispatchEvent(event);
      
      // Both should receive the event
      expect(callback1).toHaveBeenCalledWith('left');
      expect(callback2).toHaveBeenCalledWith('left');
    });
  });

  describe('Event Details', () => {
    it('should handle events with missing preventDefault', () => {
      inputHandler.onTurn(mockCallback);
      inputHandler.setEnabled(true);
      
      // Create event without preventDefault
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      
      // Should not throw
      expect(() => document.dispatchEvent(event)).not.toThrow();
      expect(mockCallback).toHaveBeenCalledWith('left');
    });
  });
});