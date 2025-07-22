import axios from 'axios';

const SPOONACULAR_API_KEY = '6e16f00bf7cb4232834000bcc58bb787';

export const searchRecipeByName = async (query, allergyList = []) => {
  const trySearch = async (q) => {
    const searchRes = await axios.get(
      'https://api.spoonacular.com/recipes/complexSearch',
      {
        params: {
          apiKey: SPOONACULAR_API_KEY,
          query: q,
          number: 1,
        },
      }
    );

    return searchRes.data.results?.[0] || null;
  };

  try {
    let recipe = await trySearch(query);

    if (!recipe) {
      const fallbackKeyword = query.split(' ').slice(-1)[0];
      console.log('🔁 フォールバック検索中:', fallbackKeyword);
      recipe = await trySearch(fallbackKeyword);
    }

    if (!recipe) throw new Error('レシピが見つかりません');

    const detailRes = await axios.get(
      `https://api.spoonacular.com/recipes/${recipe.id}/information`,
      {
        params: {
          apiKey: SPOONACULAR_API_KEY,
          includeNutrition: true,
        },
      }
    );

    const detail = detailRes.data;

    const get = (name) =>
      detail.nutrition?.nutrients?.find((n) => n.name === name) || {};

    const ingredients = detail.extendedIngredients?.map(i => i.original) || [];

    for (const allergen of allergyList) {
      const lowerAllergen = allergen.toLowerCase();
      if (ingredients.some(ing => ing.toLowerCase().includes(lowerAllergen))) {
        console.log(`⚠️ アレルゲン「${allergen}」含むためレシピ除外`);
        return null;
      }
    }

    return {
      id: detail.id,
      name: detail.title,
      image: detail.image,
      summary: detail.summary?.replace(/<[^>]+>/g, ''),
      instructions: detail.analyzedInstructions?.[0]?.steps
        ?.map((step) => step.step)
        .join('\n') || '手順情報がありません。',
      ingredients,
      nutrition: {
        calories: Math.round(get('Calories')?.amount || 0),
        protein: Math.round(get('Protein')?.amount || 0),
        fat: Math.round(get('Fat')?.amount || 0),
      },
    };

  } catch (error) {
    console.error('Spoonacular API エラー:', error);
    return null;
  }
};
