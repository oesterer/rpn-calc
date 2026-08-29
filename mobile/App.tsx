import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Calculator, formatValue, Operation } from './src/calculator';

const PALETTE = { accent: '#C45A28', orange: '#DF7A2E', indigo: '#5652A4', red: '#B93D45' };
const THEMES = {
  light: { background: '#F2F1ED', card: '#FFFFFF', key: '#E4E2DD', text: '#1F211F', muted: '#74766F', line: '#E6E4DF' },
  dark: { background: '#171916', card: '#242622', key: '#383A35', text: '#F4F3EE', muted: '#A7A99F', line: '#3B3D37' },
};
const DIGITS = [['7', '8', '9'], ['4', '5', '6'], ['1', '2', '3']];
const SCIENCE: [string, Operation][] = [['sin','sin'], ['cos','cos'], ['tan','tan'], ['√x','sqrt'], ['xʸ','pow'], ['log','log'], ['ln','ln'], ['1/x','inv'], ['x²','sq'], ['dup','dup']];

export default function App() {
  return <SafeAreaProvider><CalculatorScreen /></SafeAreaProvider>;
}

function CalculatorScreen() {
  const dark = useColorScheme() === 'dark', theme = THEMES[dark ? 'dark' : 'light'];
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [calculator] = useState(() => new Calculator());
  const [stack, setStack] = useState<number[]>([]), [entry, setEntry] = useState('');
  const [status, setStatus] = useState('Ready'), [error, setError] = useState(false);
  const [scientific, setScientific] = useState(false), [help, setHelp] = useState(false);
  const report = (message: string, bad = false) => { setStatus(message); setError(bad); };
  const sync = () => setStack([...calculator.stack]);

  const pushEntry = () => {
    if (!entry) return false;
    const value = Number(entry);
    if (!Number.isFinite(value)) { report('Invalid number', true); return false; }
    calculator.push(value); setEntry(''); return true;
  };
  const enter = () => {
    if (!entry) return run('dup');
    const value = Number(entry);
    if (!Number.isFinite(value)) return report('Invalid number', true);
    calculator.push(value); setEntry(''); sync(); report(`Pushed ${formatValue(value)}`);
  };
  const run = (operation: Operation) => {
    pushEntry();
    try { report(calculator.execute(operation)); }
    catch (reason) { report(reason instanceof Error ? reason.message : 'Something went wrong', true); }
    sync();
  };
  const digit = (value: string) => {
    if (value === '.' && entry.includes('.')) return;
    setEntry(entry + value); setError(false);
  };
  const recent = stack.slice(-5);
  const display = [...Array(5 - recent.length).fill(null), ...recent] as (number | null)[];

  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <StatusBar style={dark ? 'light' : 'dark'} />
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Toggle scientific functions" onPress={() => setScientific(!scientific)} style={styles.headerButton}><Text style={[styles.headerIcon, scientific && styles.activeIcon]}>ƒ</Text></Pressable>
      <Text style={styles.title}>RPN Calculator</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Help" onPress={() => setHelp(true)} style={styles.headerButton}><Text style={styles.headerIcon}>?</Text></Pressable>
    </View>
    <ScrollView contentContainerStyle={styles.content} bounces={false} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <View style={styles.stackHeader}><Text style={styles.eyebrow}>STACK</Text><Text style={styles.muted}>{stack.length} {stack.length === 1 ? 'value' : 'values'}</Text></View>
        {display.map((value, i) => <View key={i} style={[styles.stackRow, i < 4 && styles.border]}>
          <Text style={styles.register}>{['','','Z','Y','X'][i]}</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.stackValue, i === 4 && styles.stackTop, value === null && styles.muted]}>{value === null ? '—' : formatValue(value)}</Text>
        </View>)}
      </View>
      <View style={styles.entry} accessibilityLabel={`Entry ${entry || 'zero'}`}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.entryText, !entry && styles.muted]}>{entry || '0'}</Text>
        {!!entry && <Pressable accessibilityRole="button" accessibilityLabel="Delete digit" onPress={() => setEntry(entry.slice(0, -1))}><Text style={styles.delete}>⌫</Text></Pressable>}
      </View>
      <Text numberOfLines={1} style={[styles.status, error && styles.error]}>{error ? '●  ' : '✓  '}{status}</Text>
      {scientific && <View style={styles.science}>{SCIENCE.map(([label, op]) => <Key key={op} label={label} color={PALETTE.indigo} compact onPress={() => run(op)} styles={styles} />)}</View>}
      <View style={styles.mainPad}>
        <View style={styles.numberPad}>
          {DIGITS.map(row => <View key={row.join()} style={styles.row}>{row.map(key => <Key key={key} label={key} color={theme.key} textColor={theme.text} onPress={() => digit(key)} styles={styles} />)}</View>)}
          <View style={styles.row}><Key label="±" color={theme.key} textColor={theme.text} onPress={() => entry ? setEntry(entry.startsWith('-') ? entry.slice(1) : `-${entry}`) : run('neg')} styles={styles} /><Key label="0" color={theme.key} textColor={theme.text} onPress={() => digit('0')} styles={styles} /><Key label="." color={theme.key} textColor={theme.text} onPress={() => digit('.')} styles={styles} /></View>
        </View>
        <View style={styles.operators}>{[['÷','/'],['×','*'],['−','-'],['+','+']].map(([label, op]) => <Key key={label} label={label} color={PALETTE.orange} onPress={() => run(op as Operation)} styles={styles} />)}</View>
      </View>
      <View style={styles.row}><Key label="Drop" color={theme.muted} onPress={() => run('drop')} styles={styles} /><Key label="Swap" color={theme.muted} onPress={() => run('swap')} styles={styles} /><Key label="Enter" color={PALETTE.accent} wide onPress={enter} styles={styles} /></View>
      <View style={styles.row}><Key label="π" color={PALETTE.indigo} onPress={() => run('pi')} styles={styles} /><Key label="e" color={PALETTE.indigo} onPress={() => run('e')} styles={styles} /><Key label="Clear stack" color={PALETTE.red} wide onPress={() => run('clear')} styles={styles} /></View>
    </ScrollView>
    <Modal visible={help} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setHelp(false)}>
      <SafeAreaView style={styles.helpSafe} edges={['top','bottom']}><View style={styles.helpHeader}><Text style={styles.helpTitle}>Quick Guide</Text><Pressable onPress={() => setHelp(false)}><Text style={styles.done}>Done</Text></Pressable></View><ScrollView contentContainerStyle={styles.helpContent}>
        <Help title="How RPN works" text="Enter the first number, tap Enter, enter the second number, then choose an operation. For 8 ÷ 2: enter 8, Enter, 2, then ÷." styles={styles} />
        <Help title="The stack" text="X is the top value and Y is next. Empty Enter duplicates X. Swap exchanges X and Y; Drop removes X." styles={styles} />
        <Help title="Scientific functions" text="Tap ƒ for trigonometry, logarithms, powers, square root, reciprocal, square, and duplicate." styles={styles} />
      </ScrollView></SafeAreaView>
    </Modal>
  </SafeAreaView>;
}

type Styles = ReturnType<typeof makeStyles>;
function Key({ label, color, onPress, styles, textColor = '#FFF', wide = false, compact = false }: { label: string; color: string; onPress: () => void; styles: Styles; textColor?: string; wide?: boolean; compact?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.key, compact && styles.compactKey, wide && styles.wide, { backgroundColor: color }, pressed && styles.pressed]}><Text style={[styles.keyText, compact && styles.compactText, { color: textColor }]}>{label}</Text></Pressable>;
}
function Help({ title, text, styles }: { title: string; text: string; styles: Styles }) { return <View style={styles.helpCard}><Text style={styles.helpSection}>{title}</Text><Text style={styles.helpText}>{text}</Text></View>; }

function makeStyles(t: typeof THEMES.light) { return StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background }, header: { height: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  headerButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, headerIcon: { color: PALETTE.accent, fontSize: 24, fontWeight: '600' }, activeIcon: { backgroundColor: PALETTE.accent, color: '#FFF', overflow: 'hidden', borderRadius: 14, paddingHorizontal: 7 }, title: { color: t.text, fontSize: 17, fontWeight: '700' },
  content: { paddingHorizontal: 14, paddingBottom: 10, gap: 9 }, card: { backgroundColor: t.card, borderRadius: 18, paddingHorizontal: 14, paddingTop: 10, shadowColor: '#000', shadowOpacity: .06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  stackHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 3 }, eyebrow: { color: t.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 }, muted: { color: t.muted }, stackRow: { height: 30, flexDirection: 'row', alignItems: 'center' }, border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.line }, register: { width: 24, color: PALETTE.accent, fontSize: 13, fontWeight: '700' }, stackValue: { flex: 1, textAlign: 'right', color: t.text, fontSize: 17, fontVariant: ['tabular-nums'] }, stackTop: { fontSize: 22, fontWeight: '600' },
  entry: { minHeight: 50, backgroundColor: t.card, borderRadius: 14, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center' }, entryText: { flex: 1, textAlign: 'right', color: t.text, fontSize: 33, fontWeight: '500', fontVariant: ['tabular-nums'] }, delete: { color: t.muted, fontSize: 23, paddingLeft: 12 }, status: { height: 17, color: t.muted, fontSize: 12 }, error: { color: PALETTE.red },
  science: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, mainPad: { flexDirection: 'row', gap: 9 }, numberPad: { flex: 3, gap: 9 }, operators: { flex: 1, gap: 9 }, row: { flexDirection: 'row', gap: 9 }, key: { flex: 1, minHeight: 47, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, compactKey: { flexBasis: '18%', minHeight: 37 }, wide: { flex: 2 }, keyText: { fontSize: 20, fontWeight: '600' }, compactText: { fontSize: 15 }, pressed: { opacity: .65, transform: [{ scale: .97 }] },
  helpSafe: { flex: 1, backgroundColor: t.background }, helpHeader: { height: 54, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.line }, helpTitle: { color: t.text, fontSize: 18, fontWeight: '700' }, done: { color: PALETTE.accent, fontSize: 17, fontWeight: '600' }, helpContent: { padding: 16, gap: 14 }, helpCard: { backgroundColor: t.card, borderRadius: 16, padding: 17 }, helpSection: { color: t.text, fontSize: 17, fontWeight: '700', marginBottom: 7 }, helpText: { color: t.muted, fontSize: 16, lineHeight: 23 },
}); }
