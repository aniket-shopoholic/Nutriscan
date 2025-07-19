import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Card, Avatar, List, Divider } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { COLORS } from '../constants';

const ProfileScreen: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentTier } = useSelector((state: RootState) => state.subscription);

  const menuItems = [
    {
      title: 'Subscription',
      description: `Current plan: ${currentTier}`,
      icon: 'crown',
      onPress: () => {},
    },
    {
      title: 'Goals & Preferences',
      description: 'Update your nutrition goals',
      icon: 'target',
      onPress: () => {},
    },
    {
      title: 'Export Data',
      description: 'Download your nutrition data',
      icon: 'download',
      onPress: () => {},
    },
    {
      title: 'Privacy Settings',
      description: 'Manage your data privacy',
      icon: 'shield-check',
      onPress: () => {},
    },
    {
      title: 'Help & Support',
      description: 'Get help and contact support',
      icon: 'help-circle',
      onPress: () => {},
    },
    {
      title: 'About',
      description: 'App version and information',
      icon: 'information',
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text
              size={80}
              label={user?.displayName?.charAt(0) || 'U'}
              style={styles.avatar}
            />
            <Text style={styles.displayName}>
              {user?.displayName || 'User'}
            </Text>
            <Text style={styles.email}>{user?.email}</Text>
            
            <View style={styles.subscriptionBadge}>
              <Text style={styles.subscriptionText}>
                {currentTier === 'basic' ? 'Free Plan' : 
                 currentTier === 'premium' ? 'Premium' : 'Annual Premium'}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.menuCard}>
          <Card.Content style={styles.menuContent}>
            {menuItems.map((item, index) => (
              <View key={item.title}>
                <TouchableOpacity onPress={item.onPress}>
                  <List.Item
                    title={item.title}
                    description={item.description}
                    left={(props) => <List.Icon {...props} icon={item.icon} />}
                    right={(props) => <List.Icon {...props} icon="chevron-right" />}
                    titleStyle={styles.menuTitle}
                    descriptionStyle={styles.menuDescription}
                  />
                </TouchableOpacity>
                {index < menuItems.length - 1 && <Divider />}
              </View>
            ))}
          </Card.Content>
        </Card>

        <Card style={styles.signOutCard}>
          <Card.Content>
            <TouchableOpacity onPress={() => {}}>
              <List.Item
                title="Sign Out"
                left={(props) => <List.Icon {...props} icon="logout" color={COLORS.error} />}
                titleStyle={[styles.menuTitle, { color: COLORS.error }]}
              />
            </TouchableOpacity>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    marginBottom: 16,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: {
    backgroundColor: COLORS.primary,
    marginBottom: 16,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  subscriptionBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  subscriptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  menuCard: {
    marginBottom: 16,
  },
  menuContent: {
    padding: 0,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  menuDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  signOutCard: {
    marginBottom: 16,
  },
});

export default ProfileScreen;

