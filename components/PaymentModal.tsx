import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { FlutterwaveInit } from 'flutterwave-react-native';

const FLW_KEY = process.env.EXPO_PUBLIC_FLUTTERWAVE_KEY;

interface PaymentProps {
  visible: boolean;
  onClose: () => void;
  amount: number;
  userEmail: string;
  userName: string;
  phoneNumber: string;
  onSuccess: (transactionId: string) => void;
}

export const PaymentModal = ({ visible, onClose, amount, userEmail, userName, phoneNumber, onSuccess }: PaymentProps) => {
  const [phone, setPhone] = useState(phoneNumber || '');

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        Alert.alert(
          'Paiement indisponible',
          "L'option de paiement n'est pas disponible pour le moment. Veuillez discuter avec le vendeur pour finaliser votre achat hors application."
        );
      }, 500);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#FFF', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>Paiement Mobile Money</Text>

          <View style={{ backgroundColor: '#F8FAFC', padding: 15, borderRadius: 12, marginBottom: 20 }}>
            <Text style={{ color: '#64748B' }}>Montant total à payer</Text>
            <Text style={{ fontSize: 32, fontWeight: '800', color: '#10B981' }}>{amount} $</Text>
          </View>

          <Text style={{ fontWeight: '600', marginBottom: 8 }}>Numéro M-Pesa / Airtel / Orange</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 25, color: '#000' }}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="08XXXXXXXX"
          />
          {/* Afficher le message demander a l'utilisateur de contacter le vendeur */}
          <Text style={{ color: '#64748B', fontSize: 14, marginBottom: 25 }}>
            Veuillez contacter le vendeur pour finaliser votre achat car l'option d'achat direct n'est pas encore disponible.
          </Text>

          {/* Option de paiement désactivée, bouton inactif */}
          <TouchableOpacity
            style={{ 
              backgroundColor: '#d1d5db', 
              padding: 18, 
              borderRadius: 15, 
              alignItems: 'center',
              opacity: 1
            }}
            disabled={true}
          >
            <Text style={{ color: '#64748B', fontWeight: 'bold', fontSize: 18 }}>
              Paiement indisponible
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ color: '#94A3B8' }}>Annuler</Text>
          </TouchableOpacity>
          <View style={{ height: 20 }} />
        </View>
      </View>
    </Modal>
  );
};