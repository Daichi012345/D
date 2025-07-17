import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'mealSuggestionCache';

/**
  キャッシュ取得
 **/
export const getSuggestionCache = async () => {
    try {
        const json = await AsyncStorage.getItem(CACHE_KEY);
        return json ? JSON.parse(json) : {};
    } catch (err) {
        console.error('キャッシュ取得エラー:', err);
        return {};
    }
};

/**
  キャッシュ保存
 **/
export const saveSuggestionCache = async (cacheObj) => {
    try {
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheObj));
    } catch (err) {
        console.error('キャッシュ保存エラー:', err);
    }
};
