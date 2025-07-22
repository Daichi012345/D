import axios from 'axios';
import { OPENAI_API_KEY } from '@env';
import { getSuggestionCache, saveSuggestionCache } from './suggestionCache';

const GPT_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const GPT_MODEL = 'gpt-4o';


const sleep = (ms) => new Promise((res) => setTimeout(res, ms));


const postWithRetry = async (data, retries = 3, delay = 1500) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.post(GPT_ENDPOINT, data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      });
    } catch (err) {
      if (err.response?.status === 429 && i < retries - 1) {
        console.warn(`⏳ 429 エラー。${delay}ms 待機してリトライ (${i + 1}/${retries})`);
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }
};

const RULE_BASED_GENRE_MAP = [
  // ----- 清涼系 -----
  {
    regex: /(暑い|あつい|熱い|汗|バテ|夏バテ|さっぱり|冷たい|クール)/i,
    genre: 'さっぱり・冷たいもの',
    reason: '暑さやバテ気味の体調に合わせ、冷たくさっぱり食べられる料理を選びました',
  },
  // ----- スタミナ系 -----
  {
    regex: /(疲れ|スタミナ|元気|エネルギー|がっつり|肉|パワー)/i,
    genre: 'エネルギー系・スタミナ',
    reason: 'エネルギー補給やスタミナを意識して、肉料理などボリュームのあるものを選びました',
  },
  // ----- ヘルシー系 -----
  {
    regex: /(ヘルシー|ダイエット|軽め|胃もたれ|カロリー|さっぱりし|健康|油控え)/i,
    genre: 'ヘルシー',
    reason: '体調やダイエットを考えて、低脂質・高栄養のヘルシーな料理を選びました',
  },
  // ----- スパイシー系 -----
  {
    regex: /(辛い|刺激|スパイシー|汗かきたい|ホット)/i,
    genre: '辛いもの',
    reason: '刺激的な味で気分転換できるよう、スパイシーな料理を選びました',
  },
  // ----- こってり系 -----
  {
    regex: /(濃い味|こってり|コク|ジャンキー|満足感)/i,
    genre: '濃い味・こってり',
    reason: 'しっかり味を求める気分に合わせ、コクのある濃い味の料理を選びました',
  },
  // ----- 温まる系 -----
  {
    regex: /(寒い|冷え|風邪|喉|温まり|あたたかい)/i,
    genre: '体を温めるもの',
    reason: '冷えや風邪気味の体を温められるスープや煮込み料理を選びました',
  },
  // ----- リラックス系 -----
  {
    regex: /(落ち着き|リラックス|ほっと|優しい|やさしい|疲労感|安心)/i,
    genre: '優しい味・リラックス',
    reason: '心身を落ち着けるため、味付けがやさしく消化に良い料理を選びました',
  },
  // ----- 野菜たっぷり系 -----
  {
    regex: /(野菜|ビタミン|食物繊維|不足|サラダ|ベジタブル)/i,
    genre: '野菜たっぷり',
    reason: 'ビタミンや食物繊維を補うため、野菜をふんだんに使った料理を選びました',
  },
  // ----- 魚介系 -----
  {
    regex: /(魚|フィッシュ|シーフード|海鮮|オメガ3)/i,
    genre: '魚介・シーフード',
    reason: '良質なたんぱく質とオメガ3脂肪酸を摂れる魚介料理を選びました',
  },
  // ----- 時短・簡単系 -----
  {
    regex: /(忙しい|時間ない|簡単|時短|サッと|クイック)/i,
    genre: '簡単・時短',
    reason: '短時間で作れる簡単レシピを選びました',
  },
  // ----- ベジタリアン系 -----
  {
    regex: /(ベジ|ビーガン|肉なし|植物性|菜食)/i,
    genre: 'ベジタリアン・ビーガン',
    reason: '動物性食材を避けた植物性中心の料理を選びました',
  },
  // ----- 発酵食品・腸活系 -----
  {
    regex: /(腸内環境|発酵|キムチ|ヨーグルト|味噌|腸活)/i,
    genre: '発酵食品・腸活',
    reason: '腸内環境を整える発酵食品を取り入れた料理を選びました',
  },
  // ----- 高たんぱく系 -----
  {
    regex: /(筋トレ|プロテイン|高たんぱく|ボディメイク|タンパク)/i,
    genre: '高たんぱく',
    reason: '筋肉の回復やボディメイクに役立つ高たんぱく料理を選びました',
  },
];


const ruleBasedClassify = (userInputText) => {
  for (const rule of RULE_BASED_GENRE_MAP) {
    if (rule.regex.test(userInputText)) {
      return { genre: rule.genre, reason: rule.reason };
    }
  }
  return null; 
};

export const classifyMoodToGenre = async (userInputText) => {
  //  ルールベース
  const ruleResult = ruleBasedClassify(userInputText);
  if (ruleResult) {
    console.log('🔍 ルールベース分類ヒット');
    return ruleResult;
  }

  //  GPT へフォールバック
  console.log('🤖 規則一致なし → GPT で分類');
  const prompt = `
あなたは食事提案AIです。
以下の気分・体調に対して、次の2つを日本語で出力してください：
1. 料理ジャンル（例：辛いもの、さっぱり、エネルギー系、濃い味、ヘルシー 等）
2. そのジャンルを選んだ理由（簡潔に1文）

出力形式：
ジャンル: ○○○
理由: ○○○○○○○○○○○○

気分・体調: "${userInputText}"
`;

  const res = await postWithRetry({
    model: GPT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
  });

  const text = res.data.choices[0].message.content.trim();
  const genreMatch = text.match(/ジャンル[:：]\s*(.+)/);
  const reasonMatch = text.match(/理由[:：]\s*(.+)/);

  return {
    genre: genreMatch ? genreMatch[1] : '不明',
    reason: reasonMatch ? reasonMatch[1] : '理由が取得できませんでした',
  };
};

export const getRecipeKeywordFromGPT = async (genreText, userInputText, allergyList = []) => {
  const allergyText = allergyList.length > 0 ? `※以下の食材は絶対に含まないでください：${allergyList.join(', ')}` : '';

  const prompt = `
あなたは料理提案AIです。
次の条件を考慮し、Spoonacular に登録されていそうな主食または主菜レベルの料理名（英語のみ、例：Grilled Chicken Salad、Beef Stir-Fry）を1つだけ提案してください。
創作風・ユニークすぎる名前は禁止。スイーツ・デザート・軽食・飲み物は禁止。

気分・体調: ${userInputText}
希望ジャンル: ${genreText}
${allergyText}

料理名のみ返答してください。他の説明や記号は禁止です。
`;

  const res = await postWithRetry({
    model: GPT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
  });

  return res.data.choices[0].message.content.trim();
};

export const translateRecipeName = async (englishName) => {
  const prompt = `"${englishName}" を自然な日本語の料理名にしてください。料理名のみ返答。`;

  const res = await postWithRetry({
    model: GPT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });

  return res.data.choices[0].message.content.trim();
};

export const translateText = async (text) => {
  const prompt = `次の英語の文章を自然な日本語に翻訳してください：\n\n${text}`;

  const res = await postWithRetry({
    model: GPT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
  });

  return res.data.choices[0].message.content.trim();
};


export const handleSubmit = async (userInput, user, navigation, setLoading, searchRecipeByName, Alert) => {
  if (!userInput.trim()) {
    Alert.alert('入力エラー', '気分や体調を入力してください');
    return;
  }

  setLoading(true);

  try {
    const allergyList = user?.allergy?.split(',').map((a) => a.trim()) || [];
    const cacheKey = `${userInput.trim()}___${allergyList.join(',')}`;
    const cache = await getSuggestionCache();

    if (cache[cacheKey]) {
      console.log('✅ キャッシュから即時提案');
      navigation.navigate('MealSuggestionScreen', { meal: cache[cacheKey] });
      return;
    }

    console.log('🚀 キャッシュなし → 通常処理開始');
    const { genre, reason } = await classifyMoodToGenre(userInput);
    console.log('🎨 分類ジャンル:', genre);

    let keyword = await getRecipeKeywordFromGPT(genre, userInput, allergyList);
    console.log('🍽️ GPT 生成料理名:', keyword);

 
    let recipe = await searchRecipeByName(keyword, allergyList);

    // 見つからなければ再トライ
    if (!recipe) {
      console.log('🔄 再検索（気分・体調のみで再提案）');
      keyword = await getRecipeKeywordFromGPT('', userInput, allergyList);
      console.log('🍽️ 再提案料理名:', keyword);
      recipe = await searchRecipeByName(keyword, allergyList);

      if (!recipe) {
        Alert.alert('レシピ未発見', '条件を変えて再試行してください。');
        return;
      }
    }

    //  日本語訳
    const jpName = await translateRecipeName(recipe.name);
    console.log('🇯🇵 日本語訳:', jpName);

    //  結果まとめ
    const meal = {
      ...recipe,
      name: jpName,
      mood: genre,
      reason: reason,
    };

    cache[cacheKey] = meal;
    await saveSuggestionCache(cache);
    console.log('✅ キャッシュ保存完了');

    navigation.navigate('MealSuggestionScreen', { meal });
  } catch (err) {
    console.error('提案エラー:', err?.response?.data || err);
    Alert.alert('エラー', '提案の取得に失敗しました');
  } finally {
    setLoading(false);
  }
};
