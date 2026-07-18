import type { UnitCategory, UnitDefinition } from '../types'

const unit = (id: string, name: string, symbol: string, factor: number, offset = 0, minBase?: number): UnitDefinition => ({ id, name, symbol, factor, offset, minBase })

export const UNIT_CATEGORIES: UnitCategory[] = [
  { id: 'length', name: 'Length', baseUnitId: 'm', units: [unit('m', 'Metre', 'm', 1), unit('km', 'Kilometre', 'km', 1000), unit('cm', 'Centimetre', 'cm', .01), unit('mm', 'Millimetre', 'mm', .001), unit('mi', 'Mile', 'mi', 1609.344), unit('yd', 'Yard', 'yd', .9144), unit('ft', 'Foot', 'ft', .3048), unit('in', 'Inch', 'in', .0254), unit('nm', 'Nautical mile', 'nmi', 1852)] },
  { id: 'area', name: 'Area', baseUnitId: 'm2', units: [unit('m2', 'Square metre', 'm²', 1), unit('km2', 'Square kilometre', 'km²', 1e6), unit('cm2', 'Square centimetre', 'cm²', 1e-4), unit('ha', 'Hectare', 'ha', 1e4), unit('acre', 'Acre', 'ac', 4046.8564224), unit('ft2', 'Square foot', 'ft²', .09290304)] },
  { id: 'volume', name: 'Volume', baseUnitId: 'l', units: [unit('l', 'Litre', 'L', 1), unit('ml', 'Millilitre', 'mL', .001), unit('m3', 'Cubic metre', 'm³', 1000), unit('gal-us', 'US gallon', 'gal', 3.785411784), unit('qt-us', 'US quart', 'qt', .946352946), unit('cup', 'US cup', 'cup', .2365882365), unit('floz', 'US fluid ounce', 'fl oz', .0295735296)] },
  { id: 'mass', name: 'Mass', baseUnitId: 'kg', units: [unit('kg', 'Kilogram', 'kg', 1), unit('g', 'Gram', 'g', .001), unit('mg', 'Milligram', 'mg', 1e-6), unit('t', 'Metric tonne', 't', 1000), unit('lb', 'Pound', 'lb', .45359237), unit('oz', 'Ounce', 'oz', .028349523125), unit('stone', 'Stone', 'st', 6.35029318)] },
  { id: 'temperature', name: 'Temperature', baseUnitId: 'k', units: [unit('k', 'Kelvin', 'K', 1, 0, 0), unit('c', 'Celsius', '°C', 1, 273.15, 0), unit('f', 'Fahrenheit', '°F', 5 / 9, 255.3722222222, 0), unit('r', 'Rankine', '°R', 5 / 9, 0, 0)] },
  { id: 'time', name: 'Time', baseUnitId: 's', units: [unit('s', 'Second', 's', 1), unit('ms', 'Millisecond', 'ms', .001), unit('min', 'Minute', 'min', 60), unit('hr', 'Hour', 'h', 3600), unit('day', 'Day', 'd', 86400), unit('week', 'Week', 'wk', 604800), unit('year', 'Julian year', 'yr', 31557600)] },
  { id: 'speed', name: 'Speed', baseUnitId: 'mps', units: [unit('mps', 'Metre per second', 'm/s', 1), unit('kph', 'Kilometre per hour', 'km/h', 1 / 3.6), unit('mph', 'Mile per hour', 'mph', .44704), unit('knot', 'Knot', 'kn', .5144444444), unit('fps', 'Foot per second', 'ft/s', .3048)] },
  { id: 'acceleration', name: 'Acceleration', baseUnitId: 'mps2', units: [unit('mps2', 'Metre per second squared', 'm/s²', 1), unit('g0', 'Standard gravity', 'g₀', 9.80665), unit('fps2', 'Foot per second squared', 'ft/s²', .3048), unit('gal', 'Gal', 'Gal', .01)] },
  { id: 'pressure', name: 'Pressure', baseUnitId: 'pa', units: [unit('pa', 'Pascal', 'Pa', 1), unit('kpa', 'Kilopascal', 'kPa', 1000), unit('bar', 'Bar', 'bar', 1e5), unit('atm', 'Standard atmosphere', 'atm', 101325), unit('psi', 'Pound per square inch', 'psi', 6894.757293), unit('mmhg', 'Millimetre of mercury', 'mmHg', 133.3223874)] },
  { id: 'energy', name: 'Energy', baseUnitId: 'j', units: [unit('j', 'Joule', 'J', 1), unit('kj', 'Kilojoule', 'kJ', 1000), unit('cal', 'Calorie', 'cal', 4.184), unit('kcal', 'Kilocalorie', 'kcal', 4184), unit('wh', 'Watt-hour', 'Wh', 3600), unit('kwh', 'Kilowatt-hour', 'kWh', 3.6e6), unit('ev', 'Electronvolt', 'eV', 1.602176634e-19)] },
  { id: 'power', name: 'Power', baseUnitId: 'w', units: [unit('w', 'Watt', 'W', 1), unit('kw', 'Kilowatt', 'kW', 1000), unit('mw', 'Megawatt', 'MW', 1e6), unit('hp', 'Mechanical horsepower', 'hp', 745.699872), unit('btu-h', 'BTU per hour', 'BTU/h', .29307107)] },
  { id: 'force', name: 'Force', baseUnitId: 'n', units: [unit('n', 'Newton', 'N', 1), unit('kn', 'Kilonewton', 'kN', 1000), unit('lbf', 'Pound-force', 'lbf', 4.4482216153), unit('kgf', 'Kilogram-force', 'kgf', 9.80665), unit('dyn', 'Dyne', 'dyn', 1e-5)] },
  { id: 'angle', name: 'Angle', baseUnitId: 'rad', units: [unit('rad', 'Radian', 'rad', 1), unit('deg', 'Degree', '°', Math.PI / 180), unit('grad', 'Gradian', 'grad', Math.PI / 200), unit('turn', 'Turn', 'turn', Math.PI * 2), unit('arcmin', 'Arcminute', '′', Math.PI / 10800)] },
  { id: 'data', name: 'Data storage', baseUnitId: 'byte', units: [unit('byte', 'Byte', 'B', 1), unit('kb', 'Kilobyte', 'kB', 1000), unit('mb', 'Megabyte', 'MB', 1e6), unit('gb', 'Gigabyte', 'GB', 1e9), unit('tb', 'Terabyte', 'TB', 1e12), unit('kib', 'Kibibyte', 'KiB', 1024), unit('mib', 'Mebibyte', 'MiB', 1048576), unit('gib', 'Gibibyte', 'GiB', 1073741824), unit('bit', 'Bit', 'bit', .125)] },
  { id: 'frequency', name: 'Frequency', baseUnitId: 'hz', units: [unit('hz', 'Hertz', 'Hz', 1), unit('khz', 'Kilohertz', 'kHz', 1e3), unit('mhz', 'Megahertz', 'MHz', 1e6), unit('ghz', 'Gigahertz', 'GHz', 1e9), unit('rpm', 'Revolution per minute', 'rpm', 1 / 60)] },
  { id: 'fuel', name: 'Fuel economy', baseUnitId: 'l100', units: [
    { ...unit('l100', 'Litres per 100 km', 'L/100 km', 1), toBase: (v) => v, fromBase: (v) => v },
    { ...unit('mpg-us', 'Miles per US gallon', 'mpg', 1), toBase: (v) => 235.214583 / v, fromBase: (v) => 235.214583 / v },
    { ...unit('mpg-uk', 'Miles per imperial gallon', 'mpg UK', 1), toBase: (v) => 282.480936 / v, fromBase: (v) => 282.480936 / v },
    { ...unit('kml', 'Kilometres per litre', 'km/L', 1), toBase: (v) => 100 / v, fromBase: (v) => 100 / v },
  ] },
]

export const unitCategories = UNIT_CATEGORIES

export function getCategory(id: string) {
  return UNIT_CATEGORIES.find((category) => category.id === id) ?? UNIT_CATEGORIES[0]
}

export function convertValue(value: number, from: UnitDefinition, to: UnitDefinition) {
  if (!Number.isFinite(value)) throw new Error('Enter a finite number to convert.')
  const base = from.toBase ? from.toBase(value) : value * from.factor + (from.offset ?? 0)
  if (from.minBase !== undefined && base < from.minBase - 1e-10) throw new Error(`${from.name} cannot be below absolute zero.`)
  if (to.minBase !== undefined && base < to.minBase - 1e-10) throw new Error('That temperature is below absolute zero.')
  const converted = to.fromBase ? to.fromBase(base) : (base - (to.offset ?? 0)) / to.factor
  if (!Number.isFinite(converted)) throw new Error('This conversion is undefined for zero.')
  return converted
}

export function convertUnit(categoryId: string, value: number, fromId: string, toId: string) {
  const category = getCategory(categoryId)
  const from = category.units.find((item) => item.id === fromId)
  const to = category.units.find((item) => item.id === toId)
  if (!from || !to) throw new Error('Choose two valid units from the same category.')
  return convertValue(value, from, to)
}

export function formatConversion(value: number, precision = 12) {
  const absolute = Math.abs(value)
  if (absolute !== 0 && (absolute >= 1e12 || absolute < 1e-8)) return value.toExponential(Math.max(2, precision - 1))
  return Number(value.toPrecision(precision)).toLocaleString('en-US', { maximumFractionDigits: 14 })
}

export const formatConverted = formatConversion

export function conversionFormula(from: UnitDefinition, to: UnitDefinition) {
  if (from.id === to.id) return `${to.symbol} = ${from.symbol}`
  if (from.toBase || to.fromBase || from.offset || to.offset) return `${from.symbol} → ${to.symbol} using the category reference unit`
  const factor = from.factor / to.factor
  return `${to.symbol} = ${from.symbol} × ${Number(factor.toPrecision(10))}`
}
