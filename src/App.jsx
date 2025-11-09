// In App.jsx, update the loadUserQuotes function with error handling:

const loadUserQuotes = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Failed to load quotes from database:', error);
      // Set empty array if table doesn't exist
      setQuotes([]);
      return;
    }

    if (data) {
      setQuotes(data);
    }
  } catch (error) {
    console.error('Error loading quotes:', error);
    setQuotes([]);
  }
};

const checkTodaysQuotes = async (userId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('quotes')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);

    if (error) {
      console.warn('Failed to check daily quotes:', error);
      setTodaysQuotes(0);
      return;
    }

    if (data) {
      setTodaysQuotes(data.length);
    }
  } catch (error) {
    console.error('Error checking daily quotes:', error);
    setTodaysQuotes(0);
  }
};
