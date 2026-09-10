import { Link } from 'react-router-dom'
import { Icon, I } from './Icon'

/**
 * The one way to start a claim: the black button in the header's action slot.
 *
 * It used to exist twice. The top nav carried a "New claim" TAB (ported from
 * design/components/top-nav.jsx) and My claims put this button beside it, so on
 * that page the same action sat in two places side by side. Tabs are places you
 * go and come back to — My claims, Exports, Settings — and "New claim" is an
 * action, which is why it never fit: on /claims/new a prefix match lit BOTH it
 * and My claims as active and needed a longest-match special case to stop.
 *
 * So the tab is gone and this button goes on every TAB page — My claims,
 * Exports and Settings — keeping "start a claim" reachable from anywhere a user
 * lands between claims. It does NOT go on screens inside a claim: the worksheet
 * already carries its own black primary (Export) in this slot, and two primary
 * buttons side by side is the same competition in a new place.
 */
export default function NewClaimButton() {
  return (
    <Link to="/claims/new" className="k-btn">
      <Icon d={I.plus} size={12} /> New claim
    </Link>
  )
}
