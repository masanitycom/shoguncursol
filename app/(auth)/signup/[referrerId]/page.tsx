"use client"

import SignUpForm from '../SignUpForm'

interface Props {
    params: {
        referrerId: string
    }
}

export default function SignUpWithReferrer({ params }: Props) {
    return <SignUpForm defaultReferrerId={params.referrerId} />
} 