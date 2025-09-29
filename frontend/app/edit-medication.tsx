// frontend/app/edit-medication.tsx - ✅ REFACTORISÉ: Utilise useMedicationForm
import React from 'react';
import { ScrollView, Platform, KeyboardAvoidingView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CommonStyles } from '@/constants/theme';
import { useMedicationForm } from '@/hooks/useMedicationForm';

// Composants réutilisables
import Header from '@/components/shared/Header';
import LoadingScreen from '@/components/shared/LoadingScreen';
import SubmitButton from '@/components/shared/SubmitButton';
import FormInput from '@/components/form/FormInput';
import IconSelector from '@/components/form/IconSelector';
import FrequencySelector from '@/components/form/FrequencySelector';
import ScheduleCard from '@/components/form/ScheduleCard';
import MonthlyDaysSelector from '@/components/form/MonthlyDaysSelector';
import DatePickerField from '@/components/form/DatePickerField';

export default function EditMedicationScreen() {
  const params = useLocalSearchParams();
  const medicationId = params.id as string;

  // ✅ REFACTORISÉ: Toute la logique est dans le hook
  const {
    // États
    loading,
    saving,
    name,
    setName,
    dosage,
    setDosage,
    selectedIcon,
    selectedColor,
    frequencyMode,
    setFrequencyMode,
    schedules,
    monthlyDays,
    startDate,
    endDate,
    showStartDatePicker,
    setShowStartDatePicker,
    showEndDatePicker,
    setShowEndDatePicker,
    showTimePicker,
    setShowTimePicker,

    // Handlers
    handleIconSelect,
    addSchedule,
    removeSchedule,
    handleTimeChange,
    toggleDay,
    toggleMonthlyDay,
    handleStartDateChange,
    handleEndDateChange,
    handleSubmit,
  } = useMedicationForm({ medicationId });

  if (loading) return <LoadingScreen text="Chargement du médicament..." />;

  return (
      <SafeAreaView style={CommonStyles.container} edges={['top']}>
        <Header title="Modifier le médicament" />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          >
            <FormInput
                label="Nom du médicament"
                required
                placeholder="Ex: Doliprane, Aspégic..."
                value={name}
                onChangeText={setName}
                editable={!saving}
            />

            <FormInput
                label="Dosage (optionnel)"
                placeholder="Ex: 500mg, 1 comprimé..."
                value={dosage}
                onChangeText={setDosage}
                editable={!saving}
            />

            <IconSelector
                selectedIcon={selectedIcon}
                onSelectIcon={handleIconSelect}
                disabled={saving}
            />

            <FrequencySelector
                value={frequencyMode}
                onChange={setFrequencyMode}
                disabled={saving}
            />

            {frequencyMode === 'weekly' ? (
                <View>
                  {schedules.map((schedule, index) => (
                      <ScheduleCard
                          key={index}
                          time={schedule.time}
                          selectedDays={schedule.days}
                          onTimePress={() => setShowTimePicker(index)}
                          onDayToggle={(day) => toggleDay(index, day)}
                          onRemove={schedules.length > 1 ? () => removeSchedule(index) : undefined}
                          showTimePicker={showTimePicker === index}
                          onTimeChange={(e, time) => handleTimeChange(index, e, time)}
                          onCloseTimePicker={() => setShowTimePicker(null)}
                          disabled={saving}
                      />
                  ))}

                  <SubmitButton
                      title="Ajouter un horaire"
                      onPress={addSchedule}
                      variant="secondary"
                      icon="add"
                      disabled={saving}
                  />
                </View>
            ) : (
                <MonthlyDaysSelector
                    selectedDays={monthlyDays}
                    onToggleDay={toggleMonthlyDay}
                    disabled={saving}
                />
            )}

            <DatePickerField
                label="Date de début"
                date={startDate}
                onPress={() => setShowStartDatePicker(true)}
                disabled={saving}
            />

            {showStartDatePicker && (
                <DateTimePicker
                    value={startDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleStartDateChange}
                />
            )}

            <DatePickerField
                label="Date de fin (optionnel)"
                date={endDate}
                onPress={() => setShowEndDatePicker(true)}
                onClear={() => {}}
                disabled={saving}
            />

            {showEndDatePicker && (
                <DateTimePicker
                    value={endDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleEndDateChange}
                    minimumDate={startDate}
                />
            )}

            <SubmitButton
                title="Enregistrer les modifications"
                onPress={handleSubmit}
                loading={saving}
                disabled={saving}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
  );
}