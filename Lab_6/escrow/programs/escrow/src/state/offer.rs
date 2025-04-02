use anchor_lang::prelude::*;

#[account]
pub struct Offer {
    pub maker: Pubkey,
    pub mint_a: Pubkey,
    pub mint_b: Pubkey,
    pub amount_a: u64,
    pub amount_b: u64,
}

impl Space for Offer {
    const INIT_SPACE: usize = 8 + 8 + 32 + 32 + 8 + 8;
}