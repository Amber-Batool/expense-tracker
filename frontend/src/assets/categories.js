import {
  HiOutlineShoppingBag, HiOutlineHome, HiOutlineTruck, HiOutlineHeart,
  HiOutlineAcademicCap, HiOutlineFilm, HiOutlineLightningBolt, HiOutlineDotsCircleHorizontal,
} from 'react-icons/hi'
import { MdOutlineFastfood } from 'react-icons/md'

export const CATEGORIES = [
  { value: 'Food', label: 'Food', icon: MdOutlineFastfood, color: '#FF6B54', bg: '#FFE9E4' },
  { value: 'Shopping', label: 'Shopping', icon: HiOutlineShoppingBag, color: '#f1e236', bg: '#FCF0DA' },
  { value: 'Housing', label: 'Housing', icon: HiOutlineHome, color: '#0E6B49', bg: '#E3F3EA' },
  { value: 'Transport', label: 'Transport', icon: HiOutlineTruck, color: '#3B7DE8', bg: '#E1EBFC' },
  { value: 'Health', label: 'Health', icon: HiOutlineHeart, color: '#E83B7D', bg: '#FCE1EB' },
  { value: 'Education', label: 'Education', icon: HiOutlineAcademicCap, color: '#7B3BE8', bg: '#EBE1FC' },
  { value: 'Entertainment', label: 'Entertainment', icon: HiOutlineFilm, color: '#23C285', bg: '#DEF7EC' },
  { value: 'Bills', label: 'Bills', icon: HiOutlineLightningBolt, color: '#C69B1C', bg: '#FBF0D2' },
  { value: 'Other', label: 'Other', icon: HiOutlineDotsCircleHorizontal, color: '#7C9187', bg: '#EDF2EF' },
]

export const getCategoryMeta = (value) =>
  CATEGORIES.find((c) => c.value === value) || CATEGORIES[CATEGORIES.length - 1]
