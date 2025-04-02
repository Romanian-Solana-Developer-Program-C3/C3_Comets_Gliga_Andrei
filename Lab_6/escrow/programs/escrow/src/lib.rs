pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("cve2sfeFJ2zpMeBrXw5R5SFS4jEDqT1Qt65M36dM7hh");

#[program]
pub mod escrow {
    use super::*;

    pub fn make_offer(ctx: Context<MakeOffer>, token_a_amount: u64, token_b_amount: u64) -> Result<()> {
        make_offer::handler(ctx, token_a_amount, token_b_amount)
    }
}
