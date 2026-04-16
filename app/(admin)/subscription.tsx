import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import { useAdmin } from '@/contexts/AdminContext';

const PLANS = [
  {
    id: 'basic',
    name: 'Basique',
    price: 0,
    description: 'Plan gratuit avec fonctionnalités essentielles',
    features: [
      'Jusqu\'à 5 annonces',
      'Support par email',
      'Tableau de bord simple',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 9999,
    priceFormatted: '9,999 FC',
    description: 'Plan complet avec plus de fonctionnalités',
    features: [
      'Annonces illimitées',
      'Priorité de recherche',
      'Support prioritaire par email/chat',
      'Statistiques détaillées',
      'Galerie premium',
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 19999,
    priceFormatted: '19,999 FC',
    description: 'Plan premium avec tous les avantages',
    features: [
      'Tout du plan Premium',
      'Agent dédié',
      'Support 24/7 par téléphone',
      'Publicité gratuite',
      'Verification prioritaire des annonces',
    ],
  },
];

export default function SubscriptionScreen() {
  const isDark = useColorScheme() === 'dark';
  const { subscription, updateSubscription } = useAdmin();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'mobile' | 'card' | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const currentPlan = subscription ? PLANS.find(p => p.id === subscription.plan) || PLANS[0] : PLANS[0];

  const handleUpgradePlan = (planId: string) => {
    if (subscription && planId === subscription.plan) {
      Alert.alert('Info', 'Vous avez déjà ce plan actif');
      return;
    }
    setSelectedPlan(planId);
    setShowPaymentModal(true);
  };

  const handleMobileMoneyPayment = () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone');
      return;
    }
    if (selectedPlan) {
      Alert.alert('Succès', `Paiement de ${PLANS.find(p => p.id === selectedPlan)?.priceFormatted} initié via mobile money au ${phoneNumber}`);
      const newPlan = PLANS.find(p => p.id === selectedPlan);
      if (newPlan) {
        updateSubscription({
          plan: selectedPlan as any,
          status: 'active',
          paymentMethod: 'mobile-money',
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
      setShowPaymentModal(false);
      setPhoneNumber('');
    }
  };

  const handleCardPayment = () => {
    if (!cardNumber.trim() || !expiryDate.trim() || !cvv.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs de la carte');
      return;
    }
    if (selectedPlan) {
      Alert.alert('Succès', `Paiement de ${PLANS.find(p => p.id === selectedPlan)?.priceFormatted} traité via Google Pay`);
      const newPlan = PLANS.find(p => p.id === selectedPlan);
      if (newPlan) {
        updateSubscription({
          plan: selectedPlan as any,
          status: 'active',
          paymentMethod: 'card',
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
      setShowPaymentModal(false);
      setCardNumber('');
      setExpiryDate('');
      setCvv('');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Confirmer l\'annulation',
      'Êtes-vous sûr de vouloir annuler cet abonnement?',
      [
        { text: 'Non', onPress: () => {} },
        {
          text: 'Oui',
          onPress: () => {
            updateSubscription({
              plan: 'basic',
              status: 'expired',
              paymentMethod: undefined,
            });
            Alert.alert('Info', 'Votre abonnement a été annulé');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Current Plan Info */}
        <View style={[styles.currentPlanCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)' }]}>
          <View style={styles.planHeader}>
            <View>
              <Text style={[styles.currentLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Abonnement actuel
              </Text>
              <Text style={[styles.currentPlanName, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                {currentPlan.name}
              </Text>
            </View>
            <MaterialCommunityIcons
              name={
                subscription?.plan === 'elite'
                  ? 'diamond'
                  : subscription?.plan === 'premium'
                  ? 'lightning-bolt'
                  : 'check-circle'
              }
              size={32}
              color={
                subscription?.plan === 'elite'
                  ? '#06B6D4'
                  : subscription?.plan === 'premium'
                  ? '#FBBF24'
                  : '#06B6D4'
              }
            />
          </View>

          <Text style={[styles.currentDescription, { color: isDark ? '#CBD5E1' : '#475569' }]}>
            {currentPlan.description}
          </Text>

          {subscription?.status === 'active' && subscription?.endDate && (
            <Text style={[styles.expiryText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Expire le: {new Date(subscription.endDate).toLocaleDateString('fr-FR')}
            </Text>
          )}

          {subscription?.plan !== 'basic' && (
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: '#EF4444' }]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Annuler l'abonnement</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Available Plans */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
          Nos Plans
        </Text>

        {PLANS.map(plan => (
          <View
            key={plan.id}
            style={[
              styles.planCard,
              {
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                borderWidth: subscription?.plan === plan.id ? 2 : 1,
                borderColor:
                  subscription?.plan === plan.id
                    ? '#06B6D4'
                    : isDark
                    ? 'rgba(99, 102, 241, 0.1)'
                    : 'rgba(99, 102, 241, 0.05)',
              },
            ]}
          >
            <View style={styles.planTop}>
              <View>
                <Text style={[styles.planName, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                  {plan.name}
                </Text>
                <Text
                  style={[
                    styles.planPrice,
                    {
                      color:
                        plan.id === 'elite'
                          ? '#06B6D4'
                          : plan.id === 'premium'
                          ? '#FBBF24'
                          : '#06B6D4',
                    },
                  ]}
                >
                  {plan.price === 0 ? 'Gratuit' : plan.priceFormatted}
                </Text>
              </View>
              {subscription?.plan === plan.id && (
                <View style={[styles.activeBadge, { backgroundColor: '#10B981' }]}>
                  <Text style={styles.activeBadgeText}>Actif</Text>
                </View>
              )}
            </View>

            <Text style={[styles.planDescription, { color: isDark ? '#CBD5E1' : '#475569' }]}>
              {plan.description}
            </Text>

            <View style={styles.featuresList}>
              {plan.features.map((feature, idx) => (
                <View key={idx} style={styles.feature}>
                  <MaterialCommunityIcons name="check" size={16} color="#10B981" />
                  <Text style={[styles.featureText, { color: isDark ? '#CBD5E1' : '#475569' }]}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>

            {subscription?.plan !== plan.id && (
              <TouchableOpacity
                style={[
                  styles.selectButton,
                  {
                    backgroundColor:
                      plan.id === 'elite'
                        ? '#06B6D4'
                        : plan.id === 'premium'
                        ? '#FBBF24'
                        : '#06B6D4',
                  },
                ]}
                onPress={() => handleUpgradePlan(plan.id)}
              >
                <Text style={styles.selectButtonText}>
                  {plan.price === 0 ? 'Passer à Basique' : 'Souscrire'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        onRequestClose={() => setShowPaymentModal(false)}
        transparent
        animationType="slide"
      >
        <SafeAreaView
          style={[styles.modal, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}
        >
          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#06B6D4" />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                Sélectionner un paiement
              </Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Payment Methods */}
            <View style={styles.paymentMethods}>
              {/* Mobile Money */}
              <TouchableOpacity
                style={[
                  styles.methodCard,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    borderColor:
                      paymentMethod === 'mobile'
                        ? '#10B981'
                        : isDark
                        ? 'rgba(99, 102, 241, 0.1)'
                        : 'rgba(99, 102, 241, 0.05)',
                    borderWidth: paymentMethod === 'mobile' ? 2 : 1,
                  },
                ]}
                onPress={() => setPaymentMethod('mobile')}
              >
                <MaterialCommunityIcons
                  name="phone" as any
                  size={28}
                  color={paymentMethod === 'mobile' ? '#10B981' : '#06B6D4'}
                />
                <Text style={[styles.methodName, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                  Mobile Money
                </Text>
              </TouchableOpacity>

              {/* Card Payment */}
              <TouchableOpacity
                style={[
                  styles.methodCard,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    borderColor:
                      paymentMethod === 'card'
                        ? '#06B6D4'
                        : isDark
                        ? 'rgba(99, 102, 241, 0.1)'
                        : 'rgba(99, 102, 241, 0.05)',
                    borderWidth: paymentMethod === 'card' ? 2 : 1,
                  },
                ]}
                onPress={() => setPaymentMethod('card')}
              >
                <MaterialCommunityIcons
                  name="credit-card"
                  size={28}
                  color={paymentMethod === 'card' ? '#06B6D4' : '#06B6D4'}
                />
                <Text style={[styles.methodName, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                  Google Pay
                </Text>
              </TouchableOpacity>
            </View>

            {/* Mobile Money Form */}
            {paymentMethod === 'mobile' && (
              <View style={[styles.formContainer, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)' }]}>
                <Text style={[styles.formLabel, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                  Numéro de téléphone
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                      borderColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                      color: isDark ? '#F1F5F9' : '#0F172A',
                    },
                  ]}
                  placeholder="+256 700 000 000"
                  placeholderTextColor={isDark ? '#64748B' : '#CBD5E1'}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />

                <Text
                  style={[styles.infoText, { color: isDark ? '#94A3B8' : '#64748B' }]}
                >
                  Vous recevrez une demande de confirmation sur votre téléphone.
                </Text>

                <TouchableOpacity
                  style={[styles.payButton, { backgroundColor: '#10B981' }]}
                  onPress={handleMobileMoneyPayment}
                >
                  <Text style={styles.payButtonText}>
                    Payer {PLANS.find(p => p.id === selectedPlan)?.priceFormatted}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Card Form */}
            {paymentMethod === 'card' && (
              <View style={[styles.formContainer, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)' }]}>
                <Text style={[styles.formLabel, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                  Numéro de carte
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                      borderColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                      color: isDark ? '#F1F5F9' : '#0F172A',
                    },
                  ]}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={isDark ? '#64748B' : '#CBD5E1'}
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  keyboardType="numeric"
                />

                <View style={styles.row}>
                  <View style={styles.halfInput}>
                    <Text style={[styles.formLabel, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                      MM/YY
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                          borderColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                          color: isDark ? '#F1F5F9' : '#0F172A',
                        },
                      ]}
                      placeholder="12/25"
                      placeholderTextColor={isDark ? '#64748B' : '#CBD5E1'}
                      value={expiryDate}
                      onChangeText={setExpiryDate}
                    />
                  </View>

                  <View style={styles.halfInput}>
                    <Text style={[styles.formLabel, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                      CVV
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                          borderColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                          color: isDark ? '#F1F5F9' : '#0F172A',
                        },
                      ]}
                      placeholder="123"
                      placeholderTextColor={isDark ? '#64748B' : '#CBD5E1'}
                      value={cvv}
                      onChangeText={setCvv}
                      keyboardType="numeric"
                      secureTextEntry
                    />
                  </View>
                </View>

                <Text
                  style={[styles.infoText, { color: isDark ? '#94A3B8' : '#64748B' }]}
                >
                  Votre paiement sera traité de manière sécurisée via Google Pay.
                </Text>

                <TouchableOpacity
                  style={[styles.payButton, { backgroundColor: '#06B6D4' }]}
                  onPress={handleCardPayment}
                >
                  <Text style={styles.payButtonText}>
                    Payer {PLANS.find(p => p.id === selectedPlan)?.priceFormatted}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 20,
  },
  currentPlanCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  currentPlanName: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  currentDescription: {
    fontSize: 13,
    fontWeight: '500',
  },
  expiryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
  },
  planCard: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  planTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  activeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  planDescription: {
    fontSize: 13,
    fontWeight: '500',
  },
  featuresList: {
    gap: 8,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  selectButton: {
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  modal: {
    flex: 1,
  },
  modalContent: {
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  methodCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  methodName: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  formContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    gap: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '500',
  },
  payButton: {
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
