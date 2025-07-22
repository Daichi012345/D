import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { UserContext } from '../contexts/UserContext';
import { API_BASE_URL } from '@env';
import { translateText } from '../utils/openai';

const FILTERS = ['すべて', 'お気に入り'];

const HistoryScreen = () => {
  const { user } = useContext(UserContext);
  const navigation = useNavigation();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('すべて');

  const fetchHistory = async () => {
    if (!user || !user._id) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/recommend/${user._id}`);
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error('履歴取得失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!user || !user._id) {
        setLoading(false);
        return;
      }
      fetchHistory();
    }, [user])
  );

  const handleDelete = (id) => {
    Alert.alert('確認', 'この記録を削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_BASE_URL}/api/recommend/${id}`, {
              method: 'DELETE',
            });
            if (res.ok) {
              fetchHistory();
            } else {
              Alert.alert('削除失敗', 'サーバー側でエラーが発生しました');
            }
          } catch (err) {
            console.error('削除エラー:', err);
            Alert.alert('通信エラー', 'ネットワークエラーが発生しました');
          }
        },
      },
    ]);
  };

  const translateAndNavigate = async (item) => {
    try {
      const translatedSummary = item.summary
        ? await translateText(item.summary)
        : '概要なし';

      const translatedInstructions = item.instructions
        ? await translateText(item.instructions)
        : '手順情報がありません。';

      const translatedIngredients = item.ingredients && item.ingredients.length > 0
        ? await Promise.all(item.ingredients.map(i => translateText(i)))
        : [];

      navigation.navigate('RecipeDetailScreen', {
        name: item.meal || 'レシピ名不明',
        summary: translatedSummary,
        instructions: translatedInstructions,
        ingredients: translatedIngredients,
        servings: 2, 
      });
    } catch (err) {
      console.error('翻訳エラー:', err);
      navigation.navigate('RecipeDetailScreen', {
        name: item.meal || 'レシピ名不明',
        summary: '概要を取得できませんでした。',
        instructions: '手順情報を取得できませんでした。',
        ingredients: [],
        servings: 2, 
      });
    }
  };

  const filteredHistory = history.filter((item) => {
    if (filter === 'すべて') return true;
    if (filter === 'お気に入り') return item.isFavorite === true;
    return true;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>提案履歴</Text>

      <View style={styles.tabRow}>
        {FILTERS.map((label) => (
          <TouchableOpacity
            key={label}
            onPress={() => setFilter(label)}
            style={[styles.tabButton, filter === label && styles.activeTab]}
          >
            <Text style={styles.tabText}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : (
        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => translateAndNavigate(item)}>
              <View style={styles.card}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.image} />
                ) : (
                  <Text style={styles.noImage}>画像なし</Text>
                )}
                <Text style={styles.meal}>🍽️ {item.meal}</Text>
                <Text style={styles.detail}>気分：{item.mood}</Text>
                <Text style={styles.detail}>お気に入り：{item.isFavorite ? '✅' : '—'}</Text>
                <Text style={styles.detail}>
                  日時：{new Date(item.createdAt).toLocaleString()}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDelete(item._id)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteText}>削除</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6', padding: 20 },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 20,
    textAlign: 'center',
    color: '#4E342E',
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
  },
  activeTab: {
    backgroundColor: '#81C784',
  },
  tabText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 15,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: 14,
    marginBottom: 10,
  },
  noImage: {
    textAlign: 'center',
    color: '#999',
    marginBottom: 10,
  },
  meal: {
    fontSize: 19,
    fontWeight: '600',
    color: '#3E2723',
    marginBottom: 6,
  },
  detail: {
    fontSize: 14,
    color: '#5D4037',
    marginBottom: 2,
  },
  deleteButton: {
    backgroundColor: '#FF7043',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 12,
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default HistoryScreen;
