'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface Character {
  id: string;
  name: string;
  age: number;
  birthday: string;
  occupation: string;
  hobbies: string;
  favoriteFood: string;
  bio: string;
  appearanceStyle: string;
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  skinTone: string;
  height: string;
  bodyType: string;
  outfit: string;
  accessories: string;
  personalityArchetype: string;
  traits: string;
  speechStyle: string;
  emotionalTendency: string;
  interests: string;
  values: string;
  voiceId: string;
  voicePitch: number;
  voiceSpeed: number;
  voiceStyle: string;
  primaryImageUrl?: string;
  expressionUrls?: any;
  imagesGenerated: boolean;
  totalConversations: number;
  totalMessages: number;
  datesCount: number;
  lastInteraction: string;
}

export default function CharacterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingExpression, setIsGeneratingExpression] = useState(false);
  const [selectedExpression, setSelectedExpression] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');
  const [japaneseInput, setJapaneseInput] = useState<string>('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  const expressions = ['smile', 'happy', 'sad', 'surprised', 'angry', 'shy', 'excited'];

  // Custom prompt presets
  const customPromptPresets = [
    { label: 'キラキラした目', value: 'Add sparkling, glittering eyes with star reflections.' },
    { label: '桜の花びら', value: 'Surround with soft pink cherry blossom petals floating around.' },
    { label: 'リボン付き', value: 'Add a cute hair ribbon and sparkling accessories.' },
    { label: 'ソフト照明', value: 'Add soft warm lighting and romantic atmosphere.' },
    { label: '動きのエフェクト', value: 'Add dynamic motion lines and energetic aura effect.' },
  ];

  // Helper function to safely format dates
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '日付不明';
      }
      return date.toLocaleDateString('ja-JP');
    } catch {
      return '日付不明';
    }
  };

  useEffect(() => {
    const loadCharacterWithParams = async () => {
      const resolvedParams = await params;
      loadCharacter(resolvedParams.id);
    };
    loadCharacterWithParams();
  }, [params]);

  const loadCharacter = async (id: string) => {
    try {
      const response = await apiClient.getCharacter(id);
      setCharacter(response.character);
    } catch (error) {
      console.error('Failed to load character:', error);
      setError('キャラクターの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!character) return;
    setIsGeneratingImage(true);
    setError('');

    try {
      const response = await apiClient.generateCharacterImage(character.id);
      setCharacter((prev) => prev ? { ...prev, primaryImageUrl: response.imageUrl, imagesGenerated: true } : null);
    } catch (err: any) {
      setError(err.message || '画像生成に失敗しました');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGeneratePrompt = async () => {
    if (!japaneseInput || !selectedExpression) return;
    setIsGeneratingPrompt(true);
    setError('');

    try {
      const response = await apiClient.generatePrompt(japaneseInput, selectedExpression);
      setCustomPrompt(response.data.prompt);
      setShowAdvanced(true); // 自動的にアドバンスドオプションを開く
      setJapaneseInput(''); // 入力をクリア
    } catch (err: any) {
      setError(err.message || 'プロンプト生成に失敗しました');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleGenerateExpression = async () => {
    if (!character || !selectedExpression) return;
    setIsGeneratingExpression(true);
    setError('');

    try {
      const response = await apiClient.generateExpression(
        character.id,
        selectedExpression,
        customPrompt || undefined
      );
      setCharacter((prev) => {
        if (!prev) return null;
        const newExpressionUrls = { ...(prev.expressionUrls || {}), [response.expression]: response.imageUrl };
        return { ...prev, expressionUrls: newExpressionUrls };
      });
      setSelectedExpression('');
      setCustomPrompt('');
    } catch (err: any) {
      setError(err.message || '表情生成に失敗しました');
    } finally {
      setIsGeneratingExpression(false);
    }
  };

  const handleDelete = async () => {
    if (!character) return;
    if (!confirm(`${character.name}を削除してもよろしいですか？`)) return;

    try {
      await apiClient.deleteCharacter(character.id);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || '削除に失敗しました');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">キャラクターが見つかりません</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            ダッシュボードに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← ダッシュボードに戻る
          </button>
          <div className="flex space-x-4">
            <button
              onClick={() => router.push(`/chat/${character.id}`)}
              className="px-6 py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors"
            >
              チャットを開始
            </button>
            <button
              onClick={handleDelete}
              className="px-6 py-2 border border-red-600 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
            >
              削除
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Image */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-8">
              {character.primaryImageUrl ? (
                <img
                  src={character.primaryImageUrl}
                  alt={character.name}
                  className="w-full aspect-[3/4] object-cover"
                />
              ) : (
                <div className="w-full aspect-[3/4] bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-8xl mb-4">👤</div>
                    <p className="text-gray-600 mb-4">画像未生成</p>
                  </div>
                </div>
              )}
              <div className="p-6">
                <button
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage}
                  className="w-full px-4 py-3 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingImage ? '生成中...' : character.imagesGenerated ? '画像を再生成' : '画像を生成'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">{character.name}</h2>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">基本情報</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">年齢:</span> {character.age}歳</p>
                    <p><span className="font-medium">誕生日:</span> {formatDate(character.birthday)}</p>
                    <p><span className="font-medium">職業:</span> {character.occupation}</p>
                    <p><span className="font-medium">好きな食べ物:</span> {character.favoriteFood}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">統計</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">会話数:</span> {character.totalConversations}回</p>
                    <p><span className="font-medium">メッセージ数:</span> {character.totalMessages}通</p>
                    <p><span className="font-medium">デート回数:</span> {character.datesCount}回</p>
                    <p><span className="font-medium">最終交流:</span> {formatDate(character.lastInteraction)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-semibold text-gray-500 mb-2">自己紹介</h3>
                <p className="text-gray-700">{character.bio}</p>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-semibold text-gray-500 mb-2">趣味</h3>
                <div className="flex flex-wrap gap-2">
                  {character.hobbies.split(',').map((hobby, i) => (
                    <span key={i} className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">
                      {hobby.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Appearance Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">外見</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">スタイル</p>
                  <p className="font-medium">{character.appearanceStyle === 'anime' ? 'アニメ' : character.appearanceStyle === 'realistic' ? 'リアル' : 'マンガ'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">髪色</p>
                  <p className="font-medium">{character.hairColor}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">髪型</p>
                  <p className="font-medium">{character.hairStyle}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">瞳の色</p>
                  <p className="font-medium">{character.eyeColor}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">身長</p>
                  <p className="font-medium">{character.height}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">体型</p>
                  <p className="font-medium">{character.bodyType}</p>
                </div>
              </div>
            </div>

            {/* Personality Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">性格</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">性格タイプ</p>
                  <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full font-medium">
                    {character.personalityArchetype === 'gentle' && '優しい'}
                    {character.personalityArchetype === 'cheerful' && '明るい'}
                    {character.personalityArchetype === 'cool' && 'クール'}
                    {character.personalityArchetype === 'shy' && '恥ずかしがり屋'}
                    {character.personalityArchetype === 'energetic' && '元気'}
                    {character.personalityArchetype === 'mysterious' && 'ミステリアス'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">特徴</p>
                  <div className="flex flex-wrap gap-2">
                    {character.traits.split(',').map((trait, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {trait.trim()}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">話し方</p>
                    <p className="font-medium">{character.speechStyle}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">感情表現</p>
                    <p className="font-medium">{character.emotionalTendency}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Expression Generation */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">表情生成</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  生成する表情を選択
                </label>
                <select
                  value={selectedExpression}
                  onChange={(e) => setSelectedExpression(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">表情を選択...</option>
                  {expressions.map((exp) => (
                    <option key={exp} value={exp}>
                      {exp === 'smile' && '笑顔'}
                      {exp === 'happy' && '嬉しい'}
                      {exp === 'sad' && '悲しい'}
                      {exp === 'surprised' && '驚き'}
                      {exp === 'angry' && '怒り'}
                      {exp === 'shy' && '照れ'}
                      {exp === 'excited' && '興奮'}
                    </option>
                  ))}
                </select>
              </div>

              {/* AI-Powered Japanese Input */}
              <div className="mb-4 space-y-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-purple-200">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <span className="mr-2">🤖</span>
                  AI自動生成（日本語で入力）
                </label>
                <p className="text-xs text-gray-600 mb-2">
                  日本語で要望を入力すると、AIが英語プロンプトに自動変換します
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={japaneseInput}
                    onChange={(e) => setJapaneseInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && japaneseInput && selectedExpression) {
                        handleGeneratePrompt();
                      }
                    }}
                    placeholder="例: キラキラした目と桜の花びら"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                  <button
                    onClick={handleGeneratePrompt}
                    disabled={!japaneseInput || !selectedExpression || isGeneratingPrompt}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isGeneratingPrompt ? '生成中...' : 'AI生成'}
                  </button>
                </div>
                {!selectedExpression && japaneseInput && (
                  <p className="text-xs text-orange-600">
                    ⚠️ 先に表情を選択してください
                  </p>
                )}
              </div>

              {/* Preset Buttons - Always Visible */}
              <div className="mb-4 space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  クイックプリセット
                </label>
                <div className="flex flex-wrap gap-2">
                  {customPromptPresets.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        setCustomPrompt(preset.value);
                        setShowAdvanced(true); // 自動的にアドバンスドオプションを開く
                      }}
                      className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                        customPrompt === preset.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Options Toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="mb-3 text-sm text-purple-600 hover:text-purple-700 flex items-center font-medium"
              >
                {showAdvanced ? '▼' : '▶'} カスタムプロンプトを編集
              </button>

              {/* Custom Prompt Section */}
              {showAdvanced && (
                <div className="mb-4 space-y-3 border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    カスタムプロンプト
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    プリセットを編集するか、独自のプロンプトを入力してください
                  </p>

                  {/* Custom Prompt Input */}
                  <div className="relative">
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="例: Add sparkling eyes with star reflections and cherry blossom petals"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    />
                    {customPrompt && (
                      <button
                        onClick={() => setCustomPrompt('')}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xs bg-white px-2 py-1 rounded"
                      >
                        クリア
                      </button>
                    )}
                  </div>

                  {customPrompt && (
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-gray-600 font-medium">プレビュー:</p>
                        <span className="text-xs text-purple-600">{customPrompt.length} 文字</span>
                      </div>
                      <p className="text-sm text-gray-800">{customPrompt}</p>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleGenerateExpression}
                disabled={!selectedExpression || isGeneratingExpression}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingExpression ? '生成中...' : customPrompt ? 'カスタム表情を生成' : '表情を生成'}
              </button>

              {character.expressionUrls && Object.keys(character.expressionUrls).length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-3">生成済み表情</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(character.expressionUrls).map(([exp, url]) => (
                      <div key={exp} className="relative group">
                        <img
                          src={url as string}
                          alt={exp}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <p className="text-white text-sm font-medium">{exp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}