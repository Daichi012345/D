import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { translateText } from '../utils/openai';
import { API_BASE_URL } from '@env';
import { UserContext } from '../contexts/UserContext';

export default function MealSuggestionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { meal, genre, reason } = route.params || {};

  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(false);

  const hasAllergen = (ingredients, allergyList) => {
    return ingredients?.some(ingredient =>
      allergyList.some(allergen =>
        ingredient.toLowerCase().includes(allergen.toLowerCase())
      )
    );
  };

  const allergyList = user?.allergy?.split(',').map(a => a.trim()) || [];

  if (hasAllergen(meal.ingredients, allergyList)) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>この料理には登録されたアレルゲンが含まれています</Text>
      </View>
    );
  }

  useEffect(() => {
    const saveToHistory = async () => {
      if (!user || !meal) return;
      try {
        await fetch(`${API_BASE_URL}/api/recommend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user._id,
            meal: meal.name,
            mood: genre || '未設定',
            isFavorite: false,
            image: meal.image,
            instructions: meal.instructions,
            summary: meal.summary,
            ingredients: meal.ingredients,
          }),
        });
        console.log('✅ 自動保存成功');
      } catch (err) {
        console.error('❌ 自動保存失敗:', err);
      }
    };

    saveToHistory();
  }, [user, meal]);

  const saveRecommendation = async (isFavorite) => {
    if (!user || !user._id) {
      Alert.alert('エラー', 'ユーザー情報がありません（ログインが必要です）');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          meal: meal.name,
          mood: genre || '未設定',
          isFavorite,
          image: meal.image,
          instructions: meal.instructions,
          summary: meal.summary,
          ingredients: meal.ingredients,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert(isFavorite ? 'お気に入りに追加しました' : '保存しました');
      } else {
        Alert.alert('エラー', data.message || '保存に失敗しました');
      }
    } catch (error) {
      Alert.alert('通信エラー', error.message);
    }
  };

  const handleRecipeView = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const originalInstructions = meal.instructions?.includes('There is no procedural information.')
        ? meal.summary
        : meal.instructions || meal.summary;

      const translatedInstructions = await translateText(originalInstructions);
      const translatedSummary = await translateText(meal.summary || '');
      const translatedIngredients = meal.ingredients
        ? await Promise.all(meal.ingredients.map(item => translateText(item)))
        : [];

      navigation.navigate('RecipeDetailScreen', {
        name: meal.name,
        summary: translatedSummary,
        instructions: translatedInstructions,
        ingredients: translatedIngredients,
      });
    } catch (err) {
      console.error('翻訳失敗:', err);
      navigation.navigate('RecipeDetailScreen', {
        name: meal.name,
        summary: meal.summary,
        instructions: '手順情報を取得できませんでした。',
        ingredients: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (!meal) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>表示する食事情報がありません</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>あなたへのおすすめ</Text>

      {meal.image ? (
        <Image source={{ uri: meal.image }} style={styles.image} />
      ) : (
        <Text style={styles.noImage}>画像がありません</Text>
      )}

      <Text style={styles.mealName}>{meal.name}</Text>

      <View style={styles.reasonCard}>
        {genre && <Text style={styles.genreText}>🍽️ ジャンル：{genre}</Text>}
        {reason && <Text style={styles.reasonText}>💡 選んだ理由：{reason}</Text>}
      </View>

      <View style={styles.nutritionCard}>
        <Text style={styles.nutritionTitle}>栄養成分（1食あたり）</Text>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionLabel}>カロリー</Text>
          <Text style={styles.nutritionValue}>
            {meal.nutrition?.calories ?? '不明'} kcal
          </Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionLabel}>たんぱく質</Text>
          <Text style={styles.nutritionValue}>
            {meal.nutrition?.protein ?? '不明'} g
          </Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionLabel}>脂質</Text>
          <Text style={styles.nutritionValue}>
            {meal.nutrition?.fat ?? '不明'} g
          </Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={() => saveRecommendation(false)}
        >
          <Text style={styles.buttonText}>保存する</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.favoriteButton]}
          onPress={() => saveRecommendation(true)}
        >
          <Text style={styles.buttonText}>お気に入り</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#2196F3', marginTop: 16 }]}
        onPress={handleRecipeView}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? '翻訳中...' : 'レシピを見る'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 60,
    color: '#4E342E',
    marginVertical: 16,
    textAlign: 'center',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
  },
  noImage: {
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
  },
  mealName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#3E2723',
    marginBottom: 12,
    textAlign: 'center',
  },
  reasonCard: {
    backgroundColor: '#E0F7FA',
    padding: 14,
    borderRadius: 14,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  genreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00796B',
    marginBottom: 6,
  },
  reasonText: {
    fontSize: 14,
    color: '#004D40',
    lineHeight: 20,
  },
  nutritionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    width: '100%',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  nutritionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#555',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  saveButton: {
    backgroundColor: '#81C784',
  },
  favoriteButton: {
    backgroundColor: '#FFD54F',
  },
  recipeButton: {
    backgroundColor: '#4FC3F7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

