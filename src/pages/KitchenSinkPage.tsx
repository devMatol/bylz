import { useState } from "react";
import { Plus, AlertTriangle, FileText } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Tooltip } from "../components/ui/Tooltip";
import { Tabs } from "../components/ui/Tabs";
import { Skeleton } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import { StatCard } from "../components/shared/StatCard";
import { StatusBadge } from "../components/shared/StatusBadge";
import { EmptyState } from "../components/shared/EmptyState";
import { Amount } from "../components/shared/Amount";
import { GlowContainer } from "../components/shared/GlowContainer";

export function KitchenSinkPage() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <PageContainer
      title="Kitchen Sink"
      subtitle="Tous les composants (dev uniquement)"
    >
      <div className="flex flex-col gap-8">
        {/* Buttons */}
        <Card>
          <h3 className="text-lg font-bold mb-4">Buttons</h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              Primary
            </Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="primary" loading>
              Loading
            </Button>
            <Button variant="primary" size="sm">
              Small
            </Button>
            <Button variant="primary" size="lg">
              Large
            </Button>
          </div>
        </Card>

        {/* Badges & Status */}
        <Card>
          <h3 className="text-lg font-bold mb-4">Badges & Status</h3>
          <div className="flex flex-wrap gap-3 items-center">
            <Badge variant="default">Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <StatusBadge status="paid" />
            <StatusBadge status="pending" />
            <StatusBadge status="late" />
            <StatusBadge status="draft" />
            <StatusBadge status="rejected" />
          </div>
        </Card>

        {/* Inputs */}
        <Card>
          <h3 className="text-lg font-bold mb-4">Inputs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nom" placeholder="Votre nom" />
            <Input
              label="Avec erreur"
              placeholder="Erreur"
              error="Ce champ est requis"
            />
            <Input
              label="Avec icône"
              placeholder="Rechercher"
              leftIcon={<FileText className="w-4 h-4" />}
            />
            <Select label="Sélection">
              <option>Option 1</option>
              <option>Option 2</option>
            </Select>
          </div>
        </Card>

        {/* StatCards with glow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Chiffre d'affaires"
            value={4850}
            icon={<FileText className="w-5 h-5" />}
            delta={{ value: "+12%", positive: true }}
          />
          <StatCard
            label="Impayés"
            value={1200}
            icon={<AlertTriangle className="w-5 h-5" />}
            delta={{ value: "-5%", positive: false }}
          />
          <StatCard label="Ce mois" value={3200} />
        </div>

        {/* Amount */}
        <Card>
          <h3 className="text-lg font-bold mb-4">Amount</h3>
          <div className="flex flex-wrap items-baseline gap-6">
            <Amount value={4850} size="sm" />
            <Amount value={4850} size="md" />
            <Amount value={4850} size="lg" />
            <Amount value={4850} size="xl" />
          </div>
        </Card>

        {/* Skeleton */}
        <Card>
          <h3 className="text-lg font-bold mb-4">Skeleton</h3>
          <div className="flex flex-col gap-2">
            <Skeleton height="1.5rem" width="60%" />
            <Skeleton height="1rem" width="90%" />
            <Skeleton height="1rem" width="80%" />
          </div>
        </Card>

        {/* EmptyState */}
        <Card>
          <h3 className="text-lg font-bold mb-4">EmptyState</h3>
          <EmptyState
            icon={<FileText className="w-8 h-8" />}
            title="Aucune facture"
            description="Créez votre première facture pour commencer."
            ctaLabel="Créer une facture"
            onCta={() => toast("Facture créée", "success")}
          />
        </Card>

        {/* GlowContainer */}
        <GlowContainer variant="accent">
          <Card>
            <h3 className="text-lg font-bold mb-2">GlowContainer</h3>
            <p className="text-sm text-muted">
              Conteneur avec lueur ambiante accent.
            </p>
          </Card>
        </GlowContainer>

        {/* Toast triggers */}
        <Card>
          <h3 className="text-lg font-bold mb-4">Toast</h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => toast("Succès !", "success")}>
              Toast succès
            </Button>
            <Button variant="outline" onClick={() => toast("Attention", "warning")}>
              Toast warning
            </Button>
            <Button variant="danger" onClick={() => toast("Erreur", "danger")}>
              Toast danger
            </Button>
            <Button variant="ghost" onClick={() => toast("Info", "info")}>
              Toast info
            </Button>
          </div>
        </Card>

        {/* Modal trigger */}
        <Card>
          <h3 className="text-lg font-bold mb-4">Modal</h3>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            Ouvrir le modal
          </Button>
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Titre du modal"
          >
            <p className="text-sm text-muted mb-4">
              Contenu du modal. Cliquez à l'extérieur ou sur la croix pour fermer.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Annuler
              </Button>
              <Button variant="primary" onClick={() => setModalOpen(false)}>
                Confirmer
              </Button>
            </div>
          </Modal>
        </Card>

        {/* Tooltip */}
        <Card>
          <h3 className="text-lg font-bold mb-4">Tooltip</h3>
          <div className="flex gap-6">
            <Tooltip content="Info utile">
              <Button variant="outline">Survolez-moi</Button>
            </Tooltip>
            <Tooltip content="En bas" side="bottom">
              <Button variant="ghost">Tooltip bas</Button>
            </Tooltip>
          </div>
        </Card>

        {/* Tabs */}
        <Card>
          <h3 className="text-lg font-bold mb-4">Tabs</h3>
          <Tabs
            tabs={[
              {
                id: "tab1",
                label: "Onglet 1",
                content: <p className="text-sm text-muted">Contenu 1</p>,
              },
              {
                id: "tab2",
                label: "Onglet 2",
                content: <p className="text-sm text-muted">Contenu 2</p>,
              },
              {
                id: "tab3",
                label: "Onglet 3",
                content: <p className="text-sm text-muted">Contenu 3</p>,
              },
            ]}
          />
        </Card>
      </div>
    </PageContainer>
  );
}
