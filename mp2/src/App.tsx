import React, { useState, useEffect, useMemo }  from 'react';
import './App.css';
import { Routes, Route, Link, useParams, useNavigate, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import { ArtworkSummary, ArtworkDetail, ArticApiResponse } from './types';

interface ArtworkListProps {
    artworks: ArtworkSummary[];
    artworkIds: number[];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    sortConfig: { key: keyof ArtworkSummary; direction: 'ascending' | 'descending' };
    setSortConfig: (config: { key: keyof ArtworkSummary; direction: 'ascending' | 'descending' }) => void;
}

const ArtworkList: React.FC<ArtworkListProps> = ({ artworks, artworkIds, searchQuery, setSearchQuery, sortConfig, setSortConfig }) => {
    const handleSort = (key: keyof ArtworkSummary) => {
        const direction = sortConfig.key === key && sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
        setSortConfig({ key, direction });
    };

    return (
        <div className="view-container">
            <h2>Artworks - List View</h2>
            <div className="controls-container">
                <input
                    type="text"
                    placeholder="Search by title or artist..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-bar"
                />
                <div className="sort-controls">
                    <span>Sort by:</span>
                    <button onClick={() => handleSort('title')} className={sortConfig.key === 'title' ? 'active' : ''}>
                        Title {sortConfig.key === 'title' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                    </button>
                    <button onClick={() => handleSort('artist_display')} className={sortConfig.key === 'artist_display' ? 'active' : ''}>
                        Artist {sortConfig.key === 'artist_display' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                    </button>
                </div>
            </div>
            <ul className="artwork-list">
                {artworks.length > 0 ? (
                    artworks.map(artwork => (
                        <li key={artwork.id}>
                            <Link to={`/artwork/${artwork.id}`} state={{ allIds: artworkIds }}>
                                <span className="artwork-title">{artwork.title}</span>
                                <span className="artwork-artist"> by {artwork.artist_display}</span>
                            </Link>
                        </li>
                    ))
                ) : (
                    <p>No artworks found matching your criteria.</p>
                )}
            </ul>
        </div>
    );
};


interface ArtworkGalleryProps {
    artworks: ArtworkSummary[];
    artworkIds: number[];
    categories: string[];
    selectedCategories: string[];
    onCategoryChange: (category: string) => void;
}

const ArtworkGallery: React.FC<ArtworkGalleryProps> = ({ artworks, artworkIds, categories, selectedCategories, onCategoryChange }) => {
    const baseImageUrl = 'https://www.artic.edu/iiif/2';

    return (
        <div className="view-container">
            <h2>Artworks - Gallery View</h2>
            <div className="filter-container">
                <h3>Filter by Artwork Type:</h3>
                <div className="checkbox-group">
                    {categories.map(category => (
                        <label key={category} className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={selectedCategories.includes(category)}
                                onChange={() => onCategoryChange(category)}
                            />
                            {category}
                        </label>
                    ))}
                </div>
            </div>
            <div className="gallery-grid">
                {artworks.map(artwork => (
                    <Link to={`/artwork/${artwork.id}`} key={artwork.id} className="gallery-card" state={{ allIds: artworkIds }}>
                        <div className="gallery-image-container">
                            {artwork.image_id ? (
                                <img
                                    src={`${baseImageUrl}/${artwork.image_id}/full/400,/0/default.jpg`}
                                    alt={artwork.title}
                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400.png?text=Image+Not+Found'; }}
                                />
                            ) : (
                                <div className="no-image-placeholder">No Image</div>
                            )}
                        </div>
                        <div className="gallery-card-info">
                            <p className="gallery-card-title">{artwork.title}</p>
                            <p className="gallery-card-artist">{artwork.artist_display}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};


const ArtworkDetailComponent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [artwork, setArtwork] = useState<ArtworkDetail | null>(null);
    const [loading, setLoading] = useState(true);

    const allIds: number[] = location.state?.allIds || [];
    const currentIndex = allIds.findIndex(artworkId => artworkId === Number(id));
    const prevId = currentIndex > 0 ? allIds[currentIndex - 1] : null;
    const nextId = currentIndex < allIds.length - 1 ? allIds[currentIndex + 1] : null;

    useEffect(() => {
        const fetchArtworkDetail = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const url = `https://api.artic.edu/api/v1/artworks/${id}?fields=id,title,artist_display,image_id,date_display,medium_display,description,dimensions,credit_line`;
                const response = await axios.get<{ data: ArtworkDetail }>(url);
                setArtwork(response.data.data);
            } catch (error) {
                console.error("Failed to fetch artwork details:", error);
                setArtwork(null);
            } finally {
                setLoading(false);
            }
        };
        fetchArtworkDetail();
    }, [id]);

    const navigateToArtwork = (targetId: number | null) => {
        if (targetId) {
            navigate(`/artwork/${targetId}`, { state: { allIds } });
        }
    };

    if (loading) return <div className="message">Loading details... ✨</div>;
    if (!artwork) return <div className="message error">Artwork not found.</div>;

    const imageUrl = `https://www.artic.edu/iiif/2/${artwork.image_id}/full/843,/0/default.jpg`;

    return (
        <div className="detail-container">
            <div className="detail-card">
                {artwork.image_id && (
                    <img
                        src={imageUrl}
                        alt={artwork.title}
                        className="detail-image"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                )}
                <div className="detail-info">
                    <h2>{artwork.title}</h2>
                    <h3>{artwork.artist_display}</h3>
                    <p><strong>Date:</strong> {artwork.date_display}</p>
                    <p><strong>Medium:</strong> {artwork.medium_display}</p>
                    <p><strong>Dimensions:</strong> {artwork.dimensions}</p>
                    <p><strong>Credit:</strong> {artwork.credit_line}</p>
                    {artwork.description && (
                        <div className="description" dangerouslySetInnerHTML={{ __html: artwork.description }} />
                    )}
                </div>
            </div>
            <div className="navigation-controls">
                <button onClick={() => navigateToArtwork(prevId)} disabled={!prevId}>
                    &larr; Previous
                </button>
                <Link to="/gallery" className="back-link">Back to Gallery</Link>
                <button onClick={() => navigateToArtwork(nextId)} disabled={!nextId}>
                    Next &rarr;
                </button>
            </div>
        </div>
    );
};


export default function App() {
    const [artworks, setArtworks] = useState<ArtworkSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State for List View
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof ArtworkSummary; direction: 'ascending' | 'descending' }>({
        key: 'title',
        direction: 'ascending',
    });

    // State for Gallery View
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    useEffect(() => {
        const fetchArtworks = async () => {
            try {
                setLoading(true);
                setError(null);
                const url = 'https://api.artic.edu/api/v1/artworks?fields=id,title,artist_display,image_id,artwork_type_title&limit=100';
                const response = await axios.get<ArticApiResponse<ArtworkSummary[]>>(url);
                setArtworks(response.data.data.filter(art => art.artwork_type_title)); // Ensure artwork has a type for filtering
            } catch (err) {
                console.error("Failed to fetch artworks:", err);
                setError("Could not load artworks. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        fetchArtworks();
    }, []);

    const uniqueCategories = useMemo(() => {
        const categories = new Set(artworks.map(art => art.artwork_type_title));
        return Array.from(categories).sort();
    }, [artworks]);

    const filteredAndSortedArtworks = useMemo(() => {
        return artworks
            .filter(art =>
                art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                art.artist_display.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a, b) => {
                // Safely get the values, defaulting nulls to an empty string
                const valA = a[sortConfig.key] ?? '';
                const valB = b[sortConfig.key] ?? '';

                // Use localeCompare for robust string sorting
                const comparison = String(valA).localeCompare(String(valB));

                return sortConfig.direction === 'ascending' ? comparison : -comparison;
            });
    }, [artworks, searchQuery, sortConfig]);

    const filteredGalleryArtworks = useMemo(() => {
        if (selectedCategories.length === 0) {
            return artworks;
        }
        return artworks.filter(art => selectedCategories.includes(art.artwork_type_title));
    }, [artworks, selectedCategories]);

    const handleCategoryChange = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const listArtworkIds = useMemo(() => filteredAndSortedArtworks.map(art => art.id), [filteredAndSortedArtworks]);
    const galleryArtworkIds = useMemo(() => filteredGalleryArtworks.map(art => art.id), [filteredGalleryArtworks]);

    return (
        <div className="app-container">
            <header className="app-header">
                <nav className="main-nav">
                    <h1>Art Institute of Chicago Viewer</h1>
                    <div className="nav-links">
                        <Link to="/list">List View</Link>
                        <Link to="/gallery">Gallery View</Link>
                    </div>
                </nav>
            </header>

            <main className="app-main">
                {loading && <p className="message">Loading masterpieces... 🎨</p>}
                {error && <p className="message error">{error}</p>}
                {!loading && !error && (
                    <Routes>
                        <Route path="/" element={<Navigate to="/gallery" />} />
                        <Route path="/list" element={
                            <ArtworkList
                                artworks={filteredAndSortedArtworks}
                                artworkIds={listArtworkIds}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                sortConfig={sortConfig}
                                setSortConfig={setSortConfig}
                            />
                        }/>
                        <Route path="/gallery" element={
                            <ArtworkGallery
                                artworks={filteredGalleryArtworks}
                                artworkIds={galleryArtworkIds}
                                categories={uniqueCategories}
                                selectedCategories={selectedCategories}
                                onCategoryChange={handleCategoryChange}
                            />
                        }/>
                        {/* Pass all IDs in state to enable prev/next navigation */}
                        <Route path="/artwork/:id" element={<ArtworkDetailComponent />} />
                    </Routes>
                )}
            </main>
        </div>
    );
}