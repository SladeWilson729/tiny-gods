using System;
using System.Collections.Generic;
using ChronoTitans.Models;
using UnityEngine;

namespace ChronoTitans.Managers
{
    public class CombatManager : MonoBehaviour
    {
        public int PlayerHealth { get; private set; }
        public int PlayerMaxHealth { get; private set; }
        public int PlayerEnergy { get; private set; }
        public int EnemyHealth { get; private set; }

        public readonly List<string> DrawPile = new();
        public readonly List<string> Hand = new();
        public readonly List<string> DiscardPile = new();

        public event Action CombatWon;
        public event Action CombatLost;

        public void BeginCombat(GodDefinition god, IEnumerable<string> deckCardIds, int enemyHealth)
        {
            PlayerMaxHealth = god.BaseHealth;
            PlayerHealth = god.BaseHealth;
            PlayerEnergy = god.BaseEnergy;
            EnemyHealth = enemyHealth;

            DrawPile.Clear();
            Hand.Clear();
            DiscardPile.Clear();

            DrawPile.AddRange(deckCardIds);
            Shuffle(DrawPile);
            DrawCards(5);
        }

        public bool TryPlayCard(CardDefinition card)
        {
            if (card == null || PlayerEnergy < card.EnergyCost || !Hand.Contains(card.Id))
            {
                return false;
            }

            PlayerEnergy -= card.EnergyCost;

            // Kept intentionally compact: same action-space as web combat, now Unity-driven.
            if (card.Target == Core.TargetType.Enemy || card.Target == Core.TargetType.AllEnemies)
            {
                EnemyHealth -= Mathf.Max(0, card.Value);
            }
            else if (card.Target == Core.TargetType.Self)
            {
                PlayerHealth = Mathf.Min(PlayerMaxHealth, PlayerHealth + Mathf.Max(0, card.Value));
            }

            Hand.Remove(card.Id);
            DiscardPile.Add(card.Id);

            if (EnemyHealth <= 0)
            {
                CombatWon?.Invoke();
            }

            return true;
        }

        public void EndPlayerTurn(int enemyAttack)
        {
            PlayerHealth -= Mathf.Max(0, enemyAttack);

            if (PlayerHealth <= 0)
            {
                CombatLost?.Invoke();
                return;
            }

            PlayerEnergy = 3;
            DiscardPile.AddRange(Hand);
            Hand.Clear();
            DrawCards(5);
        }

        private void DrawCards(int count)
        {
            for (var i = 0; i < count; i++)
            {
                if (DrawPile.Count == 0)
                {
                    if (DiscardPile.Count == 0) return;
                    DrawPile.AddRange(DiscardPile);
                    DiscardPile.Clear();
                    Shuffle(DrawPile);
                }

                var index = DrawPile.Count - 1;
                Hand.Add(DrawPile[index]);
                DrawPile.RemoveAt(index);
            }
        }

        private static void Shuffle(List<string> list)
        {
            for (var i = 0; i < list.Count; i++)
            {
                var j = UnityEngine.Random.Range(i, list.Count);
                (list[i], list[j]) = (list[j], list[i]);
            }
        }
    }
}
