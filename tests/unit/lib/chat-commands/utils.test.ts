import { getEnhancedPrompt } from '@/lib/chat-commands/utils'
import { CommandId } from '@/lib/chat-commands/types'
import { COMMAND_TEMPLATES } from '@/lib/chat-commands/constants'

describe('getEnhancedPrompt', () => {
  describe('when no command is selected', () => {
    it('should return original input unchanged', () => {
      const input = 'find information about pricing strategies'
      const result = getEnhancedPrompt(input, null)
      expect(result).toBe(input)
    })

    it('should handle empty string input', () => {
      const input = ''
      const result = getEnhancedPrompt(input, null)
      expect(result).toBe('')
    })

    it('should handle very long input', () => {
      const input = 'a'.repeat(10000)
      const result = getEnhancedPrompt(input, null)
      expect(result).toBe(input)
    })
  })

  describe('when SUMMARIZE command is selected', () => {
    it('should prefix input with summarize template', () => {
      const input = 'key takeaways from the video'
      const result = getEnhancedPrompt(input, CommandId.SUMMARIZE)
      
      expect(result).toContain(COMMAND_TEMPLATES[CommandId.SUMMARIZE])
      expect(result).toContain(input)
      expect(result.endsWith(input)).toBe(true)
    })

    it('should preserve template format exactly', () => {
      const input = 'test summary request'
      const result = getEnhancedPrompt(input, CommandId.SUMMARIZE)
      
      // Template should include key sections
      expect(result).toContain('Key Points')
      expect(result).toContain('Main Insights')
      expect(result).toContain('Notable Examples')
    })
  })

  describe('when CREATE_POST command is selected', () => {
    it('should prefix input with create post template', () => {
      const input = 'create a LinkedIn post about innovation'
      const result = getEnhancedPrompt(input, CommandId.CREATE_POST)
      
      expect(result).toContain(COMMAND_TEMPLATES[CommandId.CREATE_POST])
      expect(result).toContain(input)
      expect(result.endsWith(input)).toBe(true)
    })

    it('should preserve template format exactly', () => {
      const input = 'test post request'
      const result = getEnhancedPrompt(input, CommandId.CREATE_POST)
      
      // Template should include key sections
      expect(result).toContain('Hook Line')
      expect(result).toContain('Value Content')
      expect(result).toContain('Emojis')
      expect(result).toContain('Call to Action')
    })
  })

  describe('edge cases', () => {
    it('should handle input with special characters', () => {
      const input = 'Find info about $pricing, "quotes", and <tags>'
      const result = getEnhancedPrompt(input, CommandId.SUMMARIZE)
      
      expect(result).toContain(input)
      expect(result.endsWith('>')).toBe(true)
    })

    it('should handle input with newlines', () => {
      const input = 'First line\nSecond line\nThird line'
      const result = getEnhancedPrompt(input, CommandId.CREATE_POST)
      
      expect(result).toContain('First line')
      expect(result).toContain('Second line')
      expect(result).toContain('Third line')
    })

    it('should handle input with only whitespace', () => {
      const input = '   \n\t   '
      const result = getEnhancedPrompt(input, CommandId.SUMMARIZE)
      
      expect(result).toContain(COMMAND_TEMPLATES[CommandId.SUMMARIZE])
      expect(result.endsWith(input)).toBe(true)
    })

    it('should handle unicode characters', () => {
      const input = 'Test with émojis 🎉 and 🚀 special chars ñ'
      const result = getEnhancedPrompt(input, CommandId.CREATE_POST)
      
      expect(result).toContain('émojis')
      expect(result).toContain('🎉')
      expect(result).toContain('🚀')
      expect(result).toContain('ñ')
    })
  })

  describe('template integration', () => {
    it('should ensure templates end with "User request: "', () => {
      const templates = Object.values(COMMAND_TEMPLATES)
      
      templates.forEach(template => {
        expect(template.endsWith('User request: ')).toBe(true)
      })
    })

    it('should maintain consistent formatting', () => {
      const input = 'sample input'
      
      const summarizeResult = getEnhancedPrompt(input, CommandId.SUMMARIZE)
      const createPostResult = getEnhancedPrompt(input, CommandId.CREATE_POST)
      
      // Both should contain the input
      expect(summarizeResult).toContain(input)
      expect(createPostResult).toContain(input)
      
      // Results should be different from each other
      expect(summarizeResult).not.toBe(createPostResult)
      
      // Results should be longer than original input
      expect(summarizeResult.length).toBeGreaterThan(input.length)
      expect(createPostResult.length).toBeGreaterThan(input.length)
    })
  })
})

