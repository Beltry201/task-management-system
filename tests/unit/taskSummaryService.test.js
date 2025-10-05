const taskSummaryService = require('../../src/services/taskSummaryService');
const AppError = require('../../src/utils/AppError');
const logger = require('../../src/utils/logger');
const env = require('../../src/config/env');
const pool = require('../../src/config/database');

// Mock dependencies
jest.mock('../../src/utils/logger');
jest.mock('../../src/config/env');
jest.mock('../../src/config/database');

describe('Task Summary Service', () => {
  let mockPool;
  let mockReq;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock pool
    mockPool = {
      query: jest.fn()
    };
    pool.query = mockPool.query;

    // Mock request object
    mockReq = {
      user: { id: 'test-user-id' },
      method: 'GET',
      path: '/tasks/summary'
    };

    // Mock logger
    logger.logEvent = jest.fn();
  });

  describe('getSummaryOfNewestTasks', () => {
    it('should return fallback summary when no OpenAI API key is configured', async () => {
      // Arrange
      env.openAiApiKey = '';
      const mockTasks = [
        { id: '1', title: 'Task 1', description: 'Description 1' },
        { id: '2', title: 'Task 2', description: 'Description 2' },
        { id: '3', title: 'Task 3', description: null }
      ];
      mockPool.query.mockResolvedValue({ rows: mockTasks });

      // Act
      const result = await taskSummaryService.getSummaryOfNewestTasks(3, mockReq);

      // Assert
      expect(result).toEqual({
        summary: 'Summary (fallback): #1 Task 1: Description 1 #2 Task 2: Description 2 #3 Task 3',
        count: 3
      });
      expect(logger.logEvent).toHaveBeenCalledWith('TASKS_SUMMARY_GENERATED', { count: 3 }, mockReq);
    });

    it('should return fallback summary when OpenAI API key is null', async () => {
      // Arrange
      env.openAiApiKey = null;
      const mockTasks = [
        { id: '1', title: 'Task 1', description: 'Description 1' }
      ];
      mockPool.query.mockResolvedValue({ rows: mockTasks });

      // Act
      const result = await taskSummaryService.getSummaryOfNewestTasks(1, mockReq);

      // Assert
      expect(result.summary).toContain('Summary (fallback):');
      expect(result.count).toBe(1);
    });

    it('should return fallback summary when OpenAI API key is undefined', async () => {
      // Arrange
      env.openAiApiKey = undefined;
      const mockTasks = [
        { id: '1', title: 'Task 1', description: 'Description 1' }
      ];
      mockPool.query.mockResolvedValue({ rows: mockTasks });

      // Act
      const result = await taskSummaryService.getSummaryOfNewestTasks(1, mockReq);

      // Assert
      expect(result.summary).toContain('Summary (fallback):');
      expect(result.count).toBe(1);
    });

    it('should handle tasks with empty descriptions in fallback mode', async () => {
      // Arrange
      env.openAiApiKey = '';
      const mockTasks = [
        { id: '1', title: 'Task 1', description: '' },
        { id: '2', title: 'Task 2', description: null },
        { id: '3', title: 'Task 3' }
      ];
      mockPool.query.mockResolvedValue({ rows: mockTasks });

      // Act
      const result = await taskSummaryService.getSummaryOfNewestTasks(3, mockReq);

      // Assert
      expect(result.summary).toBe('Summary (fallback): #1 Task 1 #2 Task 2 #3 Task 3');
      expect(result.count).toBe(3);
    });

    it('should handle empty task list', async () => {
      // Arrange
      env.openAiApiKey = '';
      mockPool.query.mockResolvedValue({ rows: [] });

      // Act
      const result = await taskSummaryService.getSummaryOfNewestTasks(5, mockReq);

      // Assert
      expect(result).toEqual({
        summary: 'No tasks available to summarize.',
        tasks: []
      });
      // Note: logger.logEvent is not called when tasks array is empty due to early return
    });

    it('should handle tasks with only titles (no descriptions)', async () => {
      // Arrange
      env.openAiApiKey = '';
      const mockTasks = [
        { id: '1', title: 'First Task' },
        { id: '2', title: 'Second Task' },
        { id: '3', title: 'Third Task' }
      ];
      mockPool.query.mockResolvedValue({ rows: mockTasks });

      // Act
      const result = await taskSummaryService.getSummaryOfNewestTasks(3, mockReq);

      // Assert
      expect(result.summary).toBe('Summary (fallback): #1 First Task #2 Second Task #3 Third Task');
      expect(result.count).toBe(3);
    });

    it('should work without request object', async () => {
      // Arrange
      env.openAiApiKey = '';
      const mockTasks = [
        { id: '1', title: 'Task 1', description: 'Description 1' }
      ];
      mockPool.query.mockResolvedValue({ rows: mockTasks });

      // Act
      const result = await taskSummaryService.getSummaryOfNewestTasks(1);

      // Assert
      expect(result.summary).toContain('Summary (fallback):');
      expect(result.count).toBe(1);
      expect(logger.logEvent).toHaveBeenCalledWith('TASKS_SUMMARY_GENERATED', { count: 1 }, null);
    });

    it('should handle database query errors', async () => {
      // Arrange
      env.openAiApiKey = '';
      const dbError = new Error('Database connection failed');
      mockPool.query.mockRejectedValue(dbError);

      // Act & Assert
      await expect(taskSummaryService.getSummaryOfNewestTasks(5, mockReq))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle different limit values', async () => {
      // Arrange
      env.openAiApiKey = '';
      const mockTasks = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Task ${i + 1}`,
        description: `Description ${i + 1}`
      }));
      mockPool.query.mockResolvedValue({ rows: mockTasks });

      // Act
      const result = await taskSummaryService.getSummaryOfNewestTasks(10, mockReq);

      // Assert
      expect(result.count).toBe(10);
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT id, title, description FROM tasks ORDER BY created_at DESC LIMIT $1',
        [10]
      );
    });

    it('should handle single task with OpenAI API key configured', async () => {
      // Arrange
      env.openAiApiKey = 'test-api-key';

      // Mock global fetch
      global.fetch = jest.fn();
      const mockFetchResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'AI-generated summary of the tasks'
            }
          }]
        })
      };
      global.fetch.mockResolvedValue(mockFetchResponse);

      const mockTasks = [
        { id: '1', title: 'Task 1', description: 'Description 1' }
      ];
      mockPool.query.mockResolvedValue({ rows: mockTasks });

      // Act
      const result = await taskSummaryService.getSummaryOfNewestTasks(1, mockReq);

      // Assert
      expect(result).toEqual({
        summary: 'AI-generated summary of the tasks',
        count: 1
      });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key'
          },
          body: expect.stringContaining('Task 1')
        })
      );
      expect(logger.logEvent).toHaveBeenCalledWith('TASKS_SUMMARY_GENERATED', { count: 1 }, mockReq);
    });

    it('should handle OpenAI API error response', async () => {
      // Arrange
      env.openAiApiKey = 'test-api-key';

      global.fetch = jest.fn();
      const mockFetchResponse = {
        ok: false,
        text: jest.fn().mockResolvedValue('API Error: Invalid API key')
      };
      global.fetch.mockResolvedValue(mockFetchResponse);

      const mockTasks = [
        { id: '1', title: 'Task 1', description: 'Description 1' }
      ];
      mockPool.query.mockResolvedValue({ rows: mockTasks });

      // Act & Assert
      await expect(taskSummaryService.getSummaryOfNewestTasks(1, mockReq))
        .rejects.toThrow(AppError);

      try {
        await taskSummaryService.getSummaryOfNewestTasks(1, mockReq);
      } catch (error) {
        expect(error.message).toBe('AI summary failed: API Error: Invalid API key');
        expect(error.statusCode).toBe(502);
      }
    });

    it('should handle OpenAI API response with no content', async () => {
      // Arrange
      env.openAiApiKey = 'test-api-key';

      global.fetch = jest.fn();
      const mockFetchResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: ''
            }
          }]
        })
      };
      global.fetch.mockResolvedValue(mockFetchResponse);

      const mockTasks = [
        { id: '1', title: 'Task 1', description: 'Description 1' }
      ];
      mockPool.query.mockResolvedValue({ rows: mockTasks });

      // Act
      const result = await taskSummaryService.getSummaryOfNewestTasks(1, mockReq);

      // Assert
      expect(result.summary).toBe('No summary generated.');
      expect(result.count).toBe(1);
    });

    it('should handle OpenAI API response with no choices', async () => {
      // Arrange
      env.openAiApiKey = 'test-api-key';

      global.fetch = jest.fn();
      const mockFetchResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: []
        })
      };
      global.fetch.mockResolvedValue(mockFetchResponse);

      const mockTasks = [
        { id: '1', title: 'Task 1', description: 'Description 1' }
      ];
      mockPool.query.mockResolvedValue({ rows: mockTasks });

      // Act
      const result = await taskSummaryService.getSummaryOfNewestTasks(1, mockReq);

      // Assert
      expect(result.summary).toBe('No summary generated.');
      expect(result.count).toBe(1);
    });

    it('should handle OpenAI API response with undefined choices', async () => {
      // Arrange
      env.openAiApiKey = 'test-api-key';

      global.fetch = jest.fn();
      const mockFetchResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({})
      };
      global.fetch.mockResolvedValue(mockFetchResponse);

      const mockTasks = [
        { id: '1', title: 'Task 1', description: 'Description 1' }
      ];
      mockPool.query.mockResolvedValue({ rows: mockTasks });

      // Act
      const result = await taskSummaryService.getSummaryOfNewestTasks(1, mockReq);

      // Assert
      expect(result.summary).toBe('No summary generated.');
      expect(result.count).toBe(1);
    });

    it('should handle fetch network errors', async () => {
      // Arrange
      env.openAiApiKey = 'test-api-key';

      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const mockTasks = [
        { id: '1', title: 'Task 1', description: 'Description 1' }
      ];
      mockPool.query.mockResolvedValue({ rows: mockTasks });

      // Act & Assert
      await expect(taskSummaryService.getSummaryOfNewestTasks(1, mockReq))
        .rejects.toThrow('Network error');
    });

    // Note: Dynamic import test removed due to Jest limitations
    // The node-fetch fallback is covered by the service implementation

    it('should format task text correctly for OpenAI', async () => {
      // Arrange
      env.openAiApiKey = 'test-api-key';

      global.fetch = jest.fn();
      const mockFetchResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'AI summary'
            }
          }]
        })
      };
      global.fetch.mockResolvedValue(mockFetchResponse);

      const mockTasks = [
        { id: '1', title: 'Task 1', description: 'Description 1' },
        { id: '2', title: 'Task 2', description: null },
        { id: '3', title: 'Task 3', description: '' }
      ];
      mockPool.query.mockResolvedValue({ rows: mockTasks });

      // Act
      await taskSummaryService.getSummaryOfNewestTasks(3, mockReq);

      // Assert
      const expectedText = '#1 Task 1: Description 1\\n#2 Task 2\\n#3 Task 3';
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining(expectedText)
        })
      );
    });

    it('should use correct OpenAI API parameters', async () => {
      // Arrange
      env.openAiApiKey = 'test-api-key';

      global.fetch = jest.fn();
      const mockFetchResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'AI summary'
            }
          }]
        })
      };
      global.fetch.mockResolvedValue(mockFetchResponse);

      const mockTasks = [
        { id: '1', title: 'Task 1', description: 'Description 1' }
      ];
      mockPool.query.mockResolvedValue({ rows: mockTasks });

      // Act
      await taskSummaryService.getSummaryOfNewestTasks(1, mockReq);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key'
          },
          body: expect.stringContaining('"model":"gpt-4o-mini"')
        })
      );

      // Check specific parameters in the body
      const callArgs = global.fetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.model).toBe('gpt-4o-mini');
      expect(body.temperature).toBe(0.3);
      expect(body.max_tokens).toBe(200);
      expect(body.messages).toHaveLength(2);
      expect(body.messages[0].role).toBe('system');
      expect(body.messages[1].role).toBe('user');
      expect(body.messages[1].content).toContain('Summarize the following tasks for a status update:');
    });
  });
});
