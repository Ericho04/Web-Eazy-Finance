import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Smile, X } from 'lucide-react';

interface SimpleEmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  placeholder?: string;
}

const emojiCategories = {
  '🎁 礼物': ['🎁', '🎉', '🎊', '🎈', '🎀', '💝', '🎇', '✨', '🌟', '⭐'],
  '💰 金钱': ['💰', '💵', '💴', '💶', '💷', '💳', '💎', '🪙', '💸', '🤑'],
  '🛍️ 购物': ['🛍️', '🛒', '🏪', '🏬', '🎫', '🎟️', '🧾', '📦', '📮', '🎪'],
  '🍔 食物': ['🍔', '🍕', '🍟', '🍗', '🍿', '🥤', '🍦', '🍰', '☕', '🍜'],
  '🎮 娱乐': ['🎮', '🎯', '🎲', '🎰', '🎳', '🎪', '🎭', '🎬', '🎤', '🎧'],
  '✈️ 旅行': ['✈️', '🚗', '🚕', '🚙', '🚌', '🚎', '🏨', '🗺️', '🧳', '🎒'],
  '❤️ 爱心': ['❤️', '💕', '💖', '💗', '💓', '💞', '💘', '💝', '💟', '💌'],
  '😊 表情': ['😊', '😃', '😄', '😁', '😆', '🥰', '😍', '🤩', '😎', '🤗'],
  '🔥 其他': ['🔥', '⚡', '💫', '🌈', '🎨', '🎵', '🎶', '🔔', '🏆', '🥇']
};

export function SimpleEmojiPicker({ value, onChange, placeholder = '🎁' }: SimpleEmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen]);

  const allEmojis = Object.values(emojiCategories).flat();
  const filteredEmojis = searchTerm
    ? allEmojis.filter(emoji => emoji.includes(searchTerm))
    : null;

  const handleEmojiSelect = (emoji: string) => {
    onChange(emoji);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
      <Input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 text-2xl text-center"
        maxLength={2}
      />

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Smile className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(2px)'
          }}
        >
          <div
            ref={dialogRef}
            style={{
              position: 'relative',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
              border: '1px solid #e5e7eb',
              width: '600px',
              maxHeight: '700px',
              maxWidth: '90vw',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* 顶部固定区域 */}
            <div
              style={{
                position: 'sticky',
                top: 0,
                backgroundColor: 'white',
                borderBottom: '1px solid #e5e7eb',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                zIndex: 10,
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>选择 Emoji</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <Input
                placeholder="搜索 emoji..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                autoFocus
              />
            </div>

            {/* 滚动内容区域 */}
            <div
              style={{
                padding: '20px',
                maxHeight: '550px',
                overflowY: 'auto'
              }}
            >
              {filteredEmojis ? (
                <div>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    marginBottom: '12px',
                    margin: '0 0 12px 0'
                  }}>
                    找到 {filteredEmojis.length} 个结果
                  </p>

                  {/* 搜索结果网格 - 9列 */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(9, 1fr)',
                      gap: '8px'
                    }}
                  >
                    {filteredEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleEmojiSelect(emoji)}
                        style={{
                          padding: '12px',
                          fontSize: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          aspectRatio: '1',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {filteredEmojis.length === 0 && (
                    <p style={{
                      textAlign: 'center',
                      color: '#6b7280',
                      padding: '32px 0',
                      margin: 0
                    }}>
                      没有找到合适的 emoji
                    </p>
                  )}
                </div>
              ) : (
                // 分类显示
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {Object.entries(emojiCategories).map(([category, emojis]) => (
                    <div key={category}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#6b7280',
                        marginBottom: '12px',
                        margin: '0 0 12px 0'
                      }}>
                        {category}
                      </h4>

                      {/* 分类网格 - 9列 */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(9, 1fr)',
                          gap: '8px'
                        }}
                      >
                        {emojis.map((emoji, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleEmojiSelect(emoji)}
                            style={{
                              padding: '12px',
                              fontSize: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              aspectRatio: '1',
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              borderRadius: '4px',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f3f4f6';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            title={emoji}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
