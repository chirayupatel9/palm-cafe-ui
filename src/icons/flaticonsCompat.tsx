import React from 'react';
import { motion } from 'framer-motion';
import * as Fa from 'react-icons/fa';
import * as Hi from 'react-icons/hi2';

export type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: string | number;
  color?: string;
  strokeWidth?: string | number;
  absoluteStrokeWidth?: boolean;
};

type Pack = Record<string, React.ComponentType<any>>;

const packs: Pack[] = [Fa as Pack, Hi as Pack];

const DefaultIcon: React.FC<any> = ({ className, ...props }) => (
  <svg
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.8'
    strokeLinecap='round'
    strokeLinejoin='round'
    className={className}
    {...props}
  >
    <circle cx='12' cy='12' r='9' />
    <path d='M12 7v10M7 12h10' />
  </svg>
);

const getIcon = (candidates: string[]) => {
  for (const key of candidates) {
    for (const pack of packs) {
      if (pack[key]) {
        return pack[key];
      }
    }
  }
  return DefaultIcon;
};

const createAnimatedIcon = (candidates: string[]) => {
  const BaseIcon = getIcon(candidates);

  const AnimatedIcon = React.forwardRef<SVGSVGElement, IconProps>(({ className, ...props }, ref) => {
    return (
      <motion.span
        className='inline-flex items-center justify-center'
        animate={{ y: [0, -1, 0], scale: [1, 1.04, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <BaseIcon ref={ref as any} className={className} {...props} />
      </motion.span>
    );
  });

  AnimatedIcon.displayName = 'FlatAnimatedIcon';
  return AnimatedIcon;
};

export type LucideIcon = React.ComponentType<IconProps>;
export const LucideIcon = null as unknown as LucideIcon;

export const AlertCircle = createAnimatedIcon(['FaExclamationCircle']);
export const AlertTriangle = createAnimatedIcon(['FaExclamationTriangle']);
export const ArrowDown = createAnimatedIcon(['FaArrowDown']);
export const ArrowLeft = createAnimatedIcon(['FaArrowLeft']);
export const ArrowRight = createAnimatedIcon(['FaArrowRight']);
export const ArrowUp = createAnimatedIcon(['FaArrowUp']);
export const BarChart3 = createAnimatedIcon(['FaChartBar', 'FcComboChart']);
export const Bell = createAnimatedIcon(['FaBell', 'FcAlarmClock']);
export const Building = createAnimatedIcon(['FaBuilding']);
export const Building2 = createAnimatedIcon(['FaBuilding']);
export const Calendar = createAnimatedIcon(['FaCalendarAlt']);
export const Calculator = createAnimatedIcon(['FaCalculator']);
export const Check = createAnimatedIcon(['FaCheck']);
export const CheckCircle = createAnimatedIcon(['FaCheckCircle']);
export const CheckCircle2 = createAnimatedIcon(['FaCheckCircle']);
export const CheckSquare = createAnimatedIcon(['FaCheckSquare']);
export const ChevronDown = createAnimatedIcon(['FaChevronDown']);
export const ChevronLeft = createAnimatedIcon(['FaChevronLeft']);
export const ChevronRight = createAnimatedIcon(['FaChevronRight']);
export const ChevronUp = createAnimatedIcon(['FaChevronUp']);
export const Circle = createAnimatedIcon(['FaRegCircle']);
export const ClipboardList = createAnimatedIcon(['FaClipboardList']);
export const Clock = createAnimatedIcon(['FaClock']);
export const Coffee = createAnimatedIcon(['FaCoffee']);
export const Copy = createAnimatedIcon(['FaCopy']);
export const CreditCard = createAnimatedIcon(['FaCreditCard']);
export const Crown = createAnimatedIcon(['FaCrown']);
export const Cpu = createAnimatedIcon(['FaMicrochip']);
export const DollarSign = createAnimatedIcon(['FaDollarSign']);
export const Download = createAnimatedIcon(['FaDownload']);
export const Edit = createAnimatedIcon(['FaEdit']);
export const Edit3 = createAnimatedIcon(['FaPen', 'FaEdit']);
export const ExternalLink = createAnimatedIcon(['FaExternalLinkAlt']);
export const Eye = createAnimatedIcon(['FaEye']);
export const EyeOff = createAnimatedIcon(['FaEyeSlash']);
export const FileSpreadsheet = createAnimatedIcon(['FaFileExcel']);
export const FileText = createAnimatedIcon(['FaFileAlt']);
export const Filter = createAnimatedIcon(['FaFilter']);
export const Flag = createAnimatedIcon(['FaFlag']);
export const Flame = createAnimatedIcon(['FaFire']);
export const FolderOpen = createAnimatedIcon(['FaFolderOpen']);
export const Gift = createAnimatedIcon(['FaGift']);
export const Globe = createAnimatedIcon(['FaGlobe']);
export const Heart = createAnimatedIcon(['FaHeart']);
export const Home = createAnimatedIcon(['FaHome']);
export const Info = createAnimatedIcon(['FaInfoCircle']);
export const Landmark = createAnimatedIcon(['FaLandmark']);
export const LayoutDashboard = createAnimatedIcon(['FaThLarge']);
export const Link2 = createAnimatedIcon(['FaLink']);
export const Loader = createAnimatedIcon(['FaSpinner']);
export const Loader2 = createAnimatedIcon(['FaSpinner']);
export const Lock = createAnimatedIcon(['FaLock']);
export const LogIn = createAnimatedIcon(['FaSignInAlt']);
export const LogOut = createAnimatedIcon(['FaSignOutAlt']);
export const Mail = createAnimatedIcon(['FaEnvelope']);
export const MapPin = createAnimatedIcon(['FaMapMarkerAlt']);
export const Maximize = createAnimatedIcon(['FaExpandArrowsAlt']);
export const Menu = createAnimatedIcon(['FaBars']);
export const Minus = createAnimatedIcon(['FaMinus']);
export const Package = createAnimatedIcon(['FaBoxOpen']);
export const Palette = createAnimatedIcon(['FaPalette']);
export const Pencil = createAnimatedIcon(['FaPencilAlt']);
export const Percent = createAnimatedIcon(['FaPercent']);
export const Phone = createAnimatedIcon(['FaPhone', 'FcPhone']);
export const Plus = createAnimatedIcon(['FaPlus']);
export const Printer = createAnimatedIcon(['FaPrint']);
export const Receipt = createAnimatedIcon(['FaReceipt']);
export const RefreshCw = createAnimatedIcon(['FaSyncAlt']);
export const RotateCcw = createAnimatedIcon(['FaUndoAlt']);
export const Save = createAnimatedIcon(['FaSave']);
export const Search = createAnimatedIcon(['FaSearch']);
export const Settings = createAnimatedIcon(['FaCog']);
export const Shield = createAnimatedIcon(['FaShieldAlt']);
export const ShoppingBag = createAnimatedIcon(['FaShoppingBag']);
export const ShoppingBasket = createAnimatedIcon(['FaShoppingBasket']);
export const ShoppingCart = createAnimatedIcon(['FaShoppingCart']);
export const Sparkles = createAnimatedIcon(['FaMagic']);
export const Star = createAnimatedIcon(['FaStar']);
export const Sun = createAnimatedIcon(['FaSun']);
export const Moon = createAnimatedIcon(['FaMoon']);
export const Trash2 = createAnimatedIcon(['FaTrashAlt']);
export const TrendingDown = createAnimatedIcon(['FaArrowTrendDown', 'FaArrowDown']);
export const TrendingUp = createAnimatedIcon(['FaArrowTrendUp', 'FaArrowUp']);
export const Unlock = createAnimatedIcon(['FaUnlock']);
export const Upload = createAnimatedIcon(['FaUpload']);
export const Usb = createAnimatedIcon(['FaUsb']);
export const User = createAnimatedIcon(['FaUser']);
export const UserCheck = createAnimatedIcon(['FaUserCheck']);
export const UserPlus = createAnimatedIcon(['FaUserPlus']);
export const UserX = createAnimatedIcon(['FaUserTimes']);
export const Users = createAnimatedIcon(['FaUsers']);
export const Utensils = createAnimatedIcon(['FaUtensils']);
export const Wifi = createAnimatedIcon(['FaWifi']);
export const X = createAnimatedIcon(['FaTimes']);
export const XCircle = createAnimatedIcon(['FaTimesCircle']);
export const Zap = createAnimatedIcon(['FaBolt']);
export const ChefHat = createAnimatedIcon(['FaUserTie']);
export const Locate = createAnimatedIcon(['FaLocationArrow']);
export const HeartPulse = createAnimatedIcon(['FaHeartbeat']);
