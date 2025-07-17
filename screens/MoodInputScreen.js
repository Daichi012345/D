import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../contexts/UserContext';
import { getRecipeKeywordFromGPT, translateRecipeName, classifyMoodToGenre } from '../utils/openai';
import { searchRecipeByName } from '../utils/spoonacular';
import { getSuggestionCache, saveSuggestionCache } from '../utils/suggestionCache';

export default function MoodInputScreen() {
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { user } = useContext(UserContext);

  const DEMO_MODE = false;  // 発表のときだけ true、普段は false

  useEffect(() => {
    if (DEMO_MODE) {
      showCacheForDemo();
    }
  }, []);

  const showCacheForDemo = async () => {
    const cache = await getSuggestionCache();
    console.log('==============================');
    console.log('🎤 【発表モード】キャッシュ内容確認');
    console.log('📦 現在のキャッシュ:', JSON.stringify(cache, null, 2));
    console.log('==============================');
  };

  const handleSubmit = async () => {
    if (!userInput.trim()) {
      Alert.alert('入力エラー', '気分や体調を入力してください');
      return;
    }

    setLoading(true);

    try {
      const allergyList = user?.allergy?.split(',').map(a => a.trim()) || [];
      const cacheKey = `${userInput.trim()}___${allergyList.join(',')}`;
      const cache = await getSuggestionCache();

      console.log('==============================');
      console.log(`🎯 入力: ${userInput}`);
      console.log(`💡 アレルギー: ${allergyList.join(', ') || 'なし'}`);
      console.log('==============================');

      if (cache[cacheKey]) {
        console.log('✅ 【キャッシュヒット】提案内容:', cache[cacheKey]);
        navigation.navigate('MealSuggestionScreen', {
          meal: cache[cacheKey],
          genre: cache[cacheKey].mood,
          reason: cache[cacheKey].reason,
        });
        setLoading(false);
        return;
      }

      console.log('🚀 キャッシュなし → 新規提案生成開始');

      const { genre, reason } = await classifyMoodToGenre(userInput);
      console.log(`🎨 分類ジャンル: ${genre}`);
      console.log(`📝 理由: ${reason}`);

      const keyword = await getRecipeKeywordFromGPT(genre, userInput, allergyList);
      console.log(`🍽️ GPT生成料理名: ${keyword}`);

      const recipe = await searchRecipeByName(keyword);
      if (!recipe) {
        console.log('⚠️ レシピ未発見');
        Alert.alert('レシピが見つかりません', '該当する料理が見つかりませんでした。');
        return;
      }

      const jpName = await translateRecipeName(recipe.name);
      console.log(`🇯🇵 翻訳結果: ${jpName}`);

      const meal = {
        ...recipe,
        name: jpName,
        mood: genre,
        reason: reason,
      };

      cache[cacheKey] = meal;
      await saveSuggestionCache(cache);
      console.log('✅ 新規提案をキャッシュに保存完了');

      if (DEMO_MODE) {
        await showCacheForDemo();
      }

      navigation.navigate('MealSuggestionScreen', { meal });

    } catch (err) {
      console.error('提案エラー:', err);
      Alert.alert('エラー', '食事提案の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>気分入力</Text>

      <View style={styles.body}>
        <Text style={styles.label}>今の気分や体調を入力してください</Text>
        <TextInput
          style={styles.input}
          placeholder="例：疲れていてあっさりしたものが食べたい"
          value={userInput}
          onChangeText={setUserInput}
          multiline
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>食事を提案してもらう</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#FAF9F6',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#4E342E',
    textAlign: 'center',
    marginTop: 40,  
    marginBottom: 10,
  },
  body: {
    flex: 1,
    justifyContent: 'flex-start',
    marginTop: 40,
  },
  label: {
    fontSize: 20,
    marginBottom: 16,
    color: '#4E342E',
    fontWeight: '600',
    textAlign: 'center',
  },
  input: {
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 24,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  button: {
    backgroundColor: '#81C784',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },

});
